'use strict';

const fs = require('fs');
const path = require('path');

/**
 * 米家账号登录 + 设备清单获取。
 *
 * 支持两种登录方式：
 *   - 密码登录：node-mihome 的米家云协议（小米账号 + 密码）
 *   - 二维码登录：@zythum02/mijia-api（米家 App 扫码）
 *
 * 两者最终都产出「归一化设备清单」并落盘到 {dataDir}/devices.json：
 * 每条含 did(id) / name / model / ip(localip) / token / online。
 * 运行时 MiioProvider 直接读这份清单做局域网 miIO 直连，无需再次登录——
 * 这正是“登录自动抓 token、运行走内网直连”的思路。
 *
 * 说明：
 *   - 二维码登录的云端会话由 @zythum02 持久化到 {dataDir}/cloud/auth.json（约 30 天）。
 *   - 密码登录的云端会话只存在于内存（node-mihome 不落盘），重启后设备清单仍在即可局域网直连，
 *     仅“云端回退”需要重新登录。
 *
 * 依赖许可提醒：@zythum02/mijia-api 为 GPL-3.0（强传染性），node-mihome 为 MIT。
 */

const CLOUD_SUBDIR = 'cloud';

class MijiaLogin {
  /** @param {string} dataDir 应用数据目录（如 userData/mijia） */
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.devicesFile = path.join(dataDir, 'devices.json');
    this.homesFile = path.join(dataDir, 'homes.json');
    this.cloudDir = path.join(dataDir, CLOUD_SUBDIR);
    fs.mkdirSync(this.dataDir, { recursive: true });

    this._mihome = null;       // node-mihome（CommonJS）
    this._apiMod = null;       // @zythum02/mijia-api（ESM 动态 import）
    this._api = null;          // MijiaAPI 实例（二维码登录后复用）
  }

  // ---------- 懒加载依赖 ----------

  get mihome() {
    if (!this._mihome) this._mihome = require('node-mihome');
    return this._mihome;
  }

  async _loadApiModule() {
    if (!this._apiMod) this._apiMod = await import('@zythum02/mijia-api');
    return this._apiMod;
  }

  async _makeCache() {
    const mod = await import('@zythum02/mijia-api/cache/disk-cache');
    return new mod.DiskCache(this.cloudDir);
  }

  async _getApi() {
    if (!this._api) {
      const { MijiaAPI } = await this._loadApiModule();
      this._api = new MijiaAPI(await this._makeCache());
    }
    return this._api;
  }

  // ---------- 状态 / 清单 ----------

  /** 是否已有设备清单（有即可用局域网直连） */
  hasDevices() {
    return fs.existsSync(this.devicesFile);
  }

  /** 读取归一化设备清单 */
  loadDevices() {
    try {
      const raw = fs.readFileSync(this.devicesFile, 'utf8');
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  saveDevices(devices) {
    fs.mkdirSync(this.dataDir, { recursive: true });
    fs.writeFileSync(this.devicesFile, JSON.stringify(devices, null, 2), 'utf8');
    return devices;
  }

  /* ---------- 家庭（home）清单 ---------- */

  /** 读取缓存的家庭清单（[{id,name}]） */
  loadHomes() {
    try {
      const arr = JSON.parse(fs.readFileSync(this.homesFile, 'utf8'));
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  saveHomes(homes) {
    fs.mkdirSync(this.dataDir, { recursive: true });
    fs.writeFileSync(this.homesFile, JSON.stringify(homes, null, 2), 'utf8');
    return homes;
  }

  /** 无云端会话时的兜底：从设备清单里推导家庭，仅知道 id，名称用「家庭 xxx」 */
  _deriveHomes() {
    const seen = new Map();
    for (const d of this.loadDevices()) {
      const id = String(d.homeId || '');
      if (!id || seen.has(id)) continue;
      seen.set(id, { id, name: `家庭 ${id}` });
    }
    return [...seen.values()];
  }

  /**
   * 获取家庭列表（id → 名称）。
   * 优先云端 getHomesList()（二维码会话），失败/无会话时回退到缓存或从设备清单推导。
   * @returns {Promise<{id:string,name:string}[]>}
   */
  async getHomes() {
    if (await this.hasCloudAuth()) {
      try {
        const api = await this._getApi();
        const list = await api.getHomesList();
        const homes = (list || [])
          .map((h) => ({ id: String(h.id ?? h.home_id ?? ''), name: String(h.name || h.id || '') }))
          .filter((h) => h.id);
        if (homes.length) return this.saveHomes(homes);
      } catch { /* 回退缓存 */ }
    }
    const cached = this.loadHomes();
    return cached.length ? cached : this._deriveHomes();
  }

  /** 二维码云端会话是否有效（auth.json 齐全且在有效期） */
  async hasCloudAuth() {
    try {
      const api = await this._getApi();
      return api.available === true;
    } catch {
      return false;
    }
  }

  /** 汇总当前登录状态，供渲染层展示 */
  async status() {
    return {
      hasDevices: this.hasDevices(),
      deviceCount: this.loadDevices().length,
      cloudAuth: await this.hasCloudAuth(),
      passwordSession: !!(this._mihome && this._mihome.miCloudProtocol.isLoggedIn),
      homes: this.loadHomes(),
    };
  }

  // ---------- 密码登录 ----------

  async loginPassword({ username, password, country = 'cn' } = {}) {
    if (!username || !password) throw new Error('请输入小米账号与密码');
    const cloud = this.mihome.miCloudProtocol;
    if (cloud.isLoggedIn) cloud.logout();       // 允许换号重登
    await cloud.login(username, password);
    const list = await cloud.getDevices(null, { country });
    const devices = normalizeDevices(list);
    this.saveDevices(devices);
    return { ok: true, source: 'password', count: devices.length, devices };
  }

  // ---------- 二维码登录 ----------

  /**
   * @param {(info:{qrImageUrl:string,loginUrl:string})=>void} onQR 二维码就绪回调
   */
  async loginQR(onQR) {
    const api = await this._getApi();
    await api.QRlogin(onQR ? (info) => onQR(info) : undefined);
    const devices = await this._fetchCloudDevices(api);
    this.saveDevices(devices);
    return { ok: true, source: 'qr', count: devices.length, devices };
  }

  /** 已登录二维码会话下重新拉取设备清单 */
  async refreshDevices() {
    if (!(await this.hasCloudAuth())) throw new Error('尚未登录或登录已过期');
    const api = await this._getApi();
    const devices = await this._fetchCloudDevices(api);
    return this.saveDevices(devices);
  }

  async _fetchCloudDevices(api) {
    const [own, shared] = await Promise.all([
      api.getDevicesList().catch(() => []),
      api.getSharedDevicesList().catch(() => []),
    ]);
    return normalizeDevices([...own, ...shared]);
  }

  // ---------- 云端属性读写（MiioProvider 的云回退用） ----------

  async cloudGet(props) {
    const api = await this._getApi();
    if (!api.available) throw new Error('云端会话不可用');
    return api.getDevicesProp(props);
  }

  async cloudSet(prop) {
    const api = await this._getApi();
    if (!api.available) throw new Error('云端会话不可用');
    return api.setDevicesProp(prop);
  }

  /** 云动作调用（如风扇手动上下左右），param = {did, siid, aiid, value?} */
  async cloudAction(param) {
    const api = await this._getApi();
    if (!api.available) throw new Error('云端会话不可用');
    return api.runAction(param);
  }

  // ---------- 登出 ----------

  async logout() {
    try {
      if (this._mihome && this._mihome.miCloudProtocol.isLoggedIn) {
        this._mihome.miCloudProtocol.logout();
      }
    } catch { /* ignore */ }
    this._api = null;
    try {
      const cache = await this._makeCache();
      cache.deleteAuthData();
    } catch { /* ignore */ }
    try { fs.rmSync(this.devicesFile, { force: true }); } catch { /* ignore */ }
    try { fs.rmSync(this.homesFile, { force: true }); } catch { /* ignore */ }
    return { ok: true };
  }
}

/**
 * 归一化设备：兼容 node-mihome(/home/device_list) 与
 * @zythum02(/home/home_device_list) 两种云端返回的字段差异。
 */
function normalizeDevices(list) {
  const out = [];
  const seen = new Set();
  for (const d of list || []) {
    if (!d) continue;
    const id = String(d.did ?? d.id ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      name: d.name || d.devName || id,
      model: d.model || d.deviceModel || '',
      ip: d.localip || d.localIp || '',
      token: d.token || '',
      mac: d.mac || '',
      online: !!(d.isOnline ?? d.online ?? true),
      // 子设备（如 ZigBee）会带 parent_id，运行时需经网关
      parentId: d.parent_id || d.parentId || '',
      homeId: d.home_id || d.homeId || '',
    });
  }
  return out;
}

module.exports = { MijiaLogin, normalizeDevices };

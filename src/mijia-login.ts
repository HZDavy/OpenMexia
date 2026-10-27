import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as querystring from 'querystring';
const fetch = require('node-fetch');

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
 *   - 密码登录的云端会话（ssecurity / userId / serviceToken）落盘到 {dataDir}/cloud/session.json，
 *     重启后自动恢复，云端回退与刷新设备均可继续工作。
 *
 * 依赖许可提醒：@zythum02/mijia-api 为 GPL-3.0（强传染性），node-mihome 为 MIT。
 */

const CLOUD_SUBDIR = 'cloud';

// 小米账号（account.xiaomi.com）密码登录相关的固定端点与请求头
const MI_ACCOUNT_ORIGIN = 'https://account.xiaomi.com';
const MI_SERVICE_LOGIN_URL = `${MI_ACCOUNT_ORIGIN}/pass/serviceLogin?sid=xiaomiio&_json=true`;
const MI_AUTH2_URL = `${MI_ACCOUNT_ORIGIN}/pass/serviceLoginAuth2`;
const MI_USER_AGENT = 'Android-7.1.1-1.0.0-ONEPLUS A3010-136-ABCDEFGHIJKLM APP/xiaomi.smarthome APPV/62830';
// 二次安全验证（identity）端点使用的 UA：iPhone 米家浏览器风，与登录 UA 不同
// （来自 Yonsm/MiService，基于真实设备 MiIO.chls 抓包）
const MI_OTP_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 iOS/26.3.1 MiHome/11.3.203 iPhone/iPhone17,2 DeviceId/D84D9205859533D504042022029B988E6F7DD180 UserId/8816080 APP/com.xiaomi.mihome APPV/11.3.203 Platform/iPhone Region/CN /xiaomi/miuibrowser/4.3/smartHome/ios/iPhone17,2/11.3.203 APP/com.xiaomi.mihome APPV/11.3.203 iosPassportSDK/4.2.50 iOS/26.3.1 MK/aVBob25lMTcsMg== DEVT/aVBob25l DEVS/aU9T BRA/QXBwbGU= L/zh_CN';
const PWD_SESSION_TTL = 5 * 60 * 1000;   // 图形验证码会话有效期：5 分钟
const REFRESH_COOLDOWN = 60 * 1000;      // 云端强制刷新的最小间隔，避免凭证彻底失效后反复请求

class MijiaLogin {
  dataDir: string;
  devicesFile: string;
  homesFile: string;
  cloudDir: string;
  sessionFile: string;
  _mihome: any;
  _apiMod: any;
  _api: any;
  _pwdSessions: Map<string, any>;
  _pwdCountry: string;
  _cloudRefresh: Promise<boolean> | null;   // 进行中的强制刷新（并发请求共用，避免重复刷新）
  _refreshAt: number;                       // 上次强制刷新的时间戳（冷却用）

  /** @param dataDir 应用数据目录（如 userData/mijia） */
  constructor(dataDir: string) {
    this.dataDir = dataDir;
    this.devicesFile = path.join(dataDir, 'devices.json');
    this.homesFile = path.join(dataDir, 'homes.json');
    this.cloudDir = path.join(dataDir, CLOUD_SUBDIR);
    this.sessionFile = path.join(this.cloudDir, 'session.json');   // 密码登录会话（重启后恢复用）
    fs.mkdirSync(this.dataDir, { recursive: true });

    this._mihome = null;       // node-mihome（CommonJS）
    this._apiMod = null;       // @zythum02/mijia-api（ESM 动态 import）
    this._api = null;          // MijiaAPI 实例（二维码登录后复用）
    this._pwdSessions = new Map();   // 待输入图形验证码的密码登录会话（id -> session）
    this._pwdCountry = 'cn';         // 密码登录使用的区号，供刷新设备清单时复用
    this._cloudRefresh = null;
    this._refreshAt = 0;
  }

  // ---------- 懒加载依赖 ----------

  get mihome(): any {
    if (!this._mihome) this._mihome = require('node-mihome');
    return this._mihome;
  }

  async _loadApiModule(): Promise<any> {
    if (!this._apiMod) this._apiMod = await import('@zythum02/mijia-api');
    return this._apiMod;
  }

  async _makeCache(): Promise<any> {
    const mod = await import('@zythum02/mijia-api/cache/disk-cache');
    return new mod.DiskCache(this.cloudDir);
  }

  async _getApi(): Promise<any> {
    if (!this._api) {
      const { MijiaAPI } = await this._loadApiModule();
      this._api = new MijiaAPI(await this._makeCache());
    }
    return this._api;
  }

  // ---------- 状态 / 清单 ----------

  /** 是否已有设备清单（有即可用局域网直连） */
  hasDevices(): boolean {
    return fs.existsSync(this.devicesFile);
  }

  /** 读取归一化设备清单 */
  loadDevices(): any[] {
    try {
      const raw = fs.readFileSync(this.devicesFile, 'utf8');
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  /**
   * 落盘设备清单。写入前按 did 继承已落盘的 homeId：
   * 密码登录刷新时设备清单来自 /home/device_list，该接口不返回 home_id，家庭归属只能
   * 靠 /v2/homeroom/gethome 反查补写；一旦该接口偶发失败（超时/断网），本次清单的 homeId
   * 会全为空串，若直接覆盖就会抹掉上次已写入的家庭归属，使 MiioProvider 的家庭筛选退化成
   * 「展示全部设备」并反复回退。因此这里只对空值补全，永不覆盖已有的非空归属。
   */
  saveDevices(devices: any[]): any[] {
    fs.mkdirSync(this.dataDir, { recursive: true });
    const prevHome = new Map<string, string>();
    const prevRoom = new Map<string, { id: string; name: string }>();
    for (const d of this.loadDevices()) {
      const id = String((d && d.id) || '');
      const hid = String((d && d.homeId) || '');
      if (id && hid) prevHome.set(id, hid);
      const rid = String((d && d.roomId) || '');
      if (id && rid) prevRoom.set(id, { id: rid, name: String((d && d.roomName) || '') });
    }
    for (const d of devices || []) {
      if (!d) continue;
      if (String(d.homeId || '') === '') {
        const hid = prevHome.get(String(d.id));
        if (hid) d.homeId = hid;
      }
      if (String(d.roomId || '') === '') {
        const rm = prevRoom.get(String(d.id));
        if (rm) { d.roomId = rm.id; d.roomName = rm.name; }
      }
    }
    fs.writeFileSync(this.devicesFile, JSON.stringify(devices, null, 2), 'utf8');
    return devices;
  }

  /* ---------- 家庭（home）清单 ---------- */

  /** 读取缓存的家庭清单（[{id,name}]） */
  loadHomes(): any[] {
    try {
      const arr = JSON.parse(fs.readFileSync(this.homesFile, 'utf8'));
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  saveHomes(homes: any[]): any[] {
    fs.mkdirSync(this.dataDir, { recursive: true });
    fs.writeFileSync(this.homesFile, JSON.stringify(homes, null, 2), 'utf8');
    return homes;
  }

  /** 无云端会话时的兜底：从设备清单里推导家庭，仅知道 id，名称用「家庭 xxx」 */
  _deriveHomes(): any[] {
    const seen = new Map<string, { id: string; name: string }>();
    for (const d of this.loadDevices()) {
      const id = String(d.homeId || '');
      if (!id || seen.has(id)) continue;
      seen.set(id, { id, name: `家庭 ${id}` });
    }
    return [...seen.values()];
  }

  /**
   * 获取家庭列表（id → 名称）。
   * 优先云端 getHomesList()（二维码会话），其次密码会话的 /v2/homeroom/gethome，
   * 失败/无会话时回退到缓存或从设备清单推导。
   */
  async getHomes(): Promise<{ id: string; name: string }[]> {
    if (await this.hasCloudAuth()) {
      try {
        const api = await this._getApi();
        const list = await api.getHomesList();
        const homes = (list || [])
          .map((h: any) => ({ id: String(h.id ?? h.home_id ?? ''), name: String(h.name || h.id || '') }))
          .filter((h: { id: string }) => h.id);
        if (homes.length) return this.saveHomes(homes);
      } catch { /* 回退缓存 */ }
    }
    // 密码登录会话：/home/device_list 不含 home_id，改用 /v2/homeroom/gethome 拿家庭+设备归属
    const pwdHomes = await this._fetchPwdHomes();
    if (pwdHomes.length) return this.saveHomes(pwdHomes.map((h) => ({ id: h.id, name: h.name })));
    const cached = this.loadHomes();
    return cached.length ? cached : this._deriveHomes();
  }

  /** 把 node-mihome 云端会话的返回语言设为中文，使设备默认名（未自定义）显示为中文 */
  _useZhLocale(): void {
    try {
      const cloud = this._mihome && this._mihome.miCloudProtocol;
      if (cloud) cloud.locale = 'zh_cn';
    } catch { /* 忽略 */ }
  }

  /**
   * 密码登录会话下获取「家庭 → 设备 did」归属。
   * 走 /v2/homeroom/gethome（POST，params 为空），返回 result.homelist；
   * 每个 home 顶层 dids 常为空，设备实际挂在 roomlist[].dids 里，故取并集。
   */
  async _fetchPwdHomes(): Promise<{ id: string; name: string; dids: string[]; rooms: { id: string; name: string; dids: string[] }[] }[]> {
    const cloud = this._mihome && this._mihome.miCloudProtocol;
    if (!cloud || !cloud.isLoggedIn) return [];
    try {
      const r = await cloud.request('/v2/homeroom/gethome', {}, this._pwdCountry || 'cn');
      const list = (r && r.result && r.result.homelist) || [];
      return list.map((h: any) => {
        const rooms = (Array.isArray(h.roomlist) ? h.roomlist : []).map((rm: any) => ({
          id: String(rm.id || ''),
          name: String(rm.name || ''),
          dids: (Array.isArray(rm.dids) ? rm.dids : []).map(String),
        })).filter((rm: { id: string }) => rm.id);
        return {
          id: String(h.id || ''),
          name: String(h.name || h.id || ''),
          dids: [
            ...(Array.isArray(h.dids) ? h.dids : []),
            ...rooms.flatMap((rm: { dids: string[] }) => rm.dids),
          ].map(String),
          rooms,
        };
      }).filter((h: { id: string }) => h.id);
    } catch {
      return [];
    }
  }

  /** 用家庭 did 归属反查，写入每台设备的 homeId（供家庭筛选使用） */
  _applyHomeIds(devices: any[], homes: any[]): any[] {
    const map = new Map<string, string>();
    for (const h of homes || []) {
      for (const did of h.dids || []) map.set(String(did), h.id);
    }
    if (!map.size) return devices;
    for (const d of devices || []) {
      const id = map.get(String(d.id));
      if (id) d.homeId = id;
    }
    return devices;
  }

  /** 用房间 did 归属反查，写入每台设备的 roomId / roomName（供按房间分类使用） */
  _applyRoomIds(devices: any[], homes: any[]): any[] {
    const map = new Map<string, { id: string; name: string }>();
    for (const h of homes || []) {
      for (const rm of h.rooms || []) {
        for (const did of rm.dids || []) map.set(String(did), { id: String(rm.id), name: String(rm.name || '') });
      }
    }
    if (!map.size) return devices;
    for (const d of devices || []) {
      const rm = map.get(String(d.id));
      if (rm && rm.id) { d.roomId = rm.id; d.roomName = rm.name; }
    }
    return devices;
  }

  /** 二维码会话：用 getHomesList() 的 roomlist 写入每台设备的 roomId / roomName */
  async _applyCloudRooms(api: any, devices: any[]): Promise<any[]> {
    try {
      const list = await api.getHomesList();
      const homes = (list || []).map((h: any) => ({
        rooms: (Array.isArray(h.roomlist) ? h.roomlist : []).map((rm: any) => ({
          id: String(rm.id || ''),
          name: String(rm.name || ''),
          dids: (Array.isArray(rm.dids) ? rm.dids : []).map(String),
        })).filter((rm: { id: string }) => rm.id),
      }));
      return this._applyRoomIds(devices, homes);
    } catch {
      return devices;
    }
  }

  /**
   * 二维码会话：用 getHomesList() 的家庭/房间 did 归属补写设备 homeId，并返回家庭清单。
   * 云端设备通常已带 home_id，但字段偶发缺失或落在 homeId 上；这里按 did 反查补全，
   * 只填空值、不覆盖已有非空归属，使「扫码登录」与「密码登录」的家庭归属落盘保持一致，
   * 避免扫码登录后按家庭筛选退化成「展示全部设备」。
   */
  async _applyCloudHomeIds(api: any, devices: any[]): Promise<{ id: string; name: string }[]> {
    try {
      const list = await api.getHomesList();
      const homes = (list || [])
        .map((h: any) => ({
          id: String(h.id ?? h.home_id ?? ''),
          name: String(h.name || h.id || ''),
          dids: [
            ...(Array.isArray(h.dids) ? h.dids : []),
            ...(Array.isArray(h.roomlist) ? h.roomlist : []).flatMap((rm: any) =>
              Array.isArray(rm.dids) ? rm.dids : [],
            ),
          ].map(String),
        }))
        .filter((h: { id: string }) => h.id);
      if (!homes.length) return [];
      const map = new Map<string, string>();
      for (const h of homes) for (const did of h.dids) map.set(String(did), h.id);
      for (const d of devices || []) {
        if (String(d.homeId || '') === '') {
          const hid = map.get(String(d.id));
          if (hid) d.homeId = hid;
        }
      }
      return homes.map((h: { id: string; name: string }) => ({ id: h.id, name: h.name }));
    } catch {
      return [];
    }
  }

  /** 二维码云端会话是否有效（auth.json 齐全且在有效期） */
  async hasCloudAuth(): Promise<boolean> {
    try {
      const api = await this._getApi();
      return api.available === true;
    } catch {
      return false;
    }
  }

  /** 汇总当前登录状态，供渲染层展示 */
  async status(): Promise<{
    hasDevices: boolean;
    deviceCount: number;
    cloudAuth: boolean;
    passwordSession: boolean;
    homes: any[];
  }> {
    return {
      hasDevices: this.hasDevices(),
      deviceCount: this.loadDevices().length,
      cloudAuth: await this.hasCloudAuth(),
      passwordSession: !!(this._mihome && this._mihome.miCloudProtocol.isLoggedIn),
      homes: this.loadHomes(),
    };
  }

  // ---------- 密码登录 ----------

  /**
   * 密码登录第一步：账号 + 密码。
   *
   * 小米风控可能要求额外步骤，此时**不抛错**，而是返回「需要继续输入」的响应：
   *   - 图形验证码：`{ ok:false, needCaptcha:true, sessionId, captcha:<dataURL> }`
   *   - 二次安全验证：`{ ok:false, needCode:true, sessionId, method, hint }`
   * 由渲染层继续输入，并用 loginPasswordCaptcha() 提交。
   * 无需额外步骤时直接完成登录并返回设备清单。
   */
  async loginPassword(opts: { username?: string; password?: string; country?: string } = {}): Promise<any> {
    const { username, password, country = 'cn' } = opts;
    if (!username || !password) throw new Error('请输入小米账号与密码');
    this._prunePwdSessions();
    let sess: any;
    try {
      sess = await this._pwdStart(username, password, country);
    } catch (e) {
      throw new Error(friendlyLoginError(e));
    }
    if (sess.captchaUrl) {
      sess.stage = 'captcha';
      this._pwdSessions.set(sess.id, sess);
      return { ok: false, needCaptcha: true, sessionId: sess.id, captcha: await this._fetchCaptcha(sess) };
    }
    if (sess.notificationUrl) return this._2faBegin(sess);
    return this._pwdFinish(sess);
  }

  /**
   * 密码登录续步：提交图形验证码 / 二次验证码（按会话 stage 路由）。
   * 出错会重新返回「需要继续输入」的响应（needCaptcha / needCode），而非抛错。
   */
  async loginPasswordCaptcha(opts: { sessionId?: string; code?: any } = {}): Promise<any> {
    const { sessionId, code } = opts;
    const sess = this._pwdSessions.get(sessionId as string);
    if (!sess) throw new Error('验证码会话已过期，请重新登录');
    const c = code == null ? '' : String(code).trim();
    if (!c) throw new Error(sess.stage === '2fa_code' ? '请输入验证码' : '请输入图形验证码');

    // 二次验证：提交邮箱/短信验证码
    if (sess.stage === '2fa_code') return this._2faSubmit(sess, c);
    // 二次验证：提交「发送验证码所需的图形验证码」
    if (sess.stage === '2fa_send_captcha') {
      try {
        const data = await this._2faSendTicket(sess, c);
        return await this._2faAfterSend(sess, data);
      } catch (e) {
        throw new Error(friendlyLoginError(e));
      }
    }

    // 默认：图形验证码
    try {
      const stage = await this._pwdAuth(sess, c);
      if (stage === 'ok') {
        this._pwdSessions.delete(sessionId as string);
        return this._pwdFinish(sess);
      }
      if (stage === '2fa') return this._2faBegin(sess);
      // stage === 'captcha'：验证码不正确，小米已返回新图
      return { ok: false, needCaptcha: true, sessionId, captcha: await this._fetchCaptcha(sess) };
    } catch (e) {
      this._pwdSessions.delete(sessionId as string);
      // 验证码不正确：小米此时可能不再返回新验证码，用原账号密码重新取一张，方便用户直接重试
      try {
        const fresh = await this._pwdStart(sess.username, sess.password, sess.country);
        if (fresh.captchaUrl) {
          fresh.stage = 'captcha';
          this._pwdSessions.set(fresh.id, fresh);
          return { ok: false, needCaptcha: true, sessionId: fresh.id, captcha: await this._fetchCaptcha(fresh) };
        }
        if (fresh.notificationUrl) return this._2faBegin(fresh);
        return this._pwdFinish(fresh);
      } catch (e2) {
        throw new Error(friendlyLoginError(e2));
      }
    }
  }

  /**
   * 刷新验证码图片（用户点「点击刷新」）：按当前 stage 重新取一张。
   * 图形验证码用原账号密码重新发起；二次验证发送用的图形验证码则重新触发发送。
   */
  async refreshPwdCaptcha(opts: { sessionId?: string } = {}): Promise<any> {
    const { sessionId } = opts;
    const sess = this._pwdSessions.get(sessionId as string);
    if (!sess) throw new Error('验证码会话已过期，请重新登录');
    if (sess.stage === '2fa_send_captcha') {
      const data = await this._2faSendTicket(sess);
      return this._2faAfterSend(sess, data);
    }
    const fresh = await this._pwdStart(sess.username, sess.password, sess.country);
    if (fresh.captchaUrl) {
      fresh.stage = 'captcha';
      this._pwdSessions.set(fresh.id, fresh);
      return { ok: false, needCaptcha: true, sessionId: fresh.id, captcha: await this._fetchCaptcha(fresh) };
    }
    if (fresh.notificationUrl) return this._2faBegin(fresh);
    return this._pwdFinish(fresh);
  }

  /** 发起第一步登录：取 _sign → 提交账号密码（可能需要验证码） */
  async _pwdStart(username: string, password: string, country: string): Promise<any> {
    const jar: any = {
      sdkVersion: 'accountsdk-18.8.15',
      deviceId: crypto.randomBytes(8).toString('hex').toUpperCase(),
    };
    const res1 = await fetch(MI_SERVICE_LOGIN_URL, { headers: { 'User-Agent': MI_USER_AGENT } });
    absorbSetCookie(jar, res1);
    const d1 = parseXiaomiJson(await res1.text());
    if (!d1._sign) throw new Error('登录失败：未能获取登录签名，请检查网络后重试');

    const sess: any = {
      id: crypto.randomBytes(8).toString('hex'),
      createdAt: Date.now(),
      jar,
      username,
      password,
      country: country || 'cn',
      captchaUrl: null,
      auth: {
        hash: crypto.createHash('md5').update(password).digest('hex').toUpperCase(),
        _json: 'true',
        sid: 'xiaomiio',
        callback: 'https://sts.api.io.mi.com/sts',
        qs: '?sid=xiaomiio&_json=true',
        _sign: d1._sign,
        user: username,
      },
    };
    await this._pwdAuth(sess);
    return sess;
  }

  /**
   * 提交 serviceLoginAuth2（可带验证码 captCode）。
   * @returns 'ok'=已拿到会话；'captcha'=需图形验证码；'2fa'=需二次安全验证
   * 成功写回 ssecurity/userId/location；需图形验证码写回 captchaUrl；需二次验证写回 notificationUrl。
   */
  async _pwdAuth(sess: any, captchaCode?: string): Promise<'ok' | 'captcha' | '2fa'> {
    const body: any = { ...sess.auth };
    if (captchaCode) {
      // 小米 serviceLoginAuth2 实际认可的验证码字段名是 captCode
      // （见 Xiaomi-cloud-tokens-extractor / MiUnlockTool 的实现）；
      // 此前误用 captchaCode，导致验证码永远被判定为错误。这里两个都带上以兼容接口变体。
      body.captCode = captchaCode;
      body.captchaCode = captchaCode;
    }
    const res = await fetch(MI_AUTH2_URL, {
      method: 'POST',
      timeout: 8000,
      headers: {
        'User-Agent': MI_USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookieHeader(sess.jar),
      },
      body: querystring.stringify(body),
    });
    absorbSetCookie(sess.jar, res);
    const data = parseXiaomiJson(await res.text());

    if (data.ssecurity && data.userId && data.location) {
      sess.ssecurity = data.ssecurity;
      sess.userId = data.userId;
      sess.location = data.location;
      sess.captchaUrl = null;
      sess.notificationUrl = null;
      return 'ok';
    }
    if (data.captchaUrl) {
      sess.captchaUrl = data.captchaUrl;
      return 'captcha';
    }
    if (data.notificationUrl) {
      // 小米对该账号触发了二次安全验证（邮箱/短信验证码），进入 2FA 流程
      sess.notificationUrl = data.notificationUrl;
      return '2fa';
    }
    throw new Error(xiaomiErrText(data));
  }

  /**
   * 下载图形验证码图片，转成 dataURL 供界面显示；非图片响应返回 null（由界面提示刷新）。
   * 注意：小米 getCode 接口返回的 Content-Type 是 application/octet-stream，
   * 若直接用响应头拼 dataURL，<img> 无法识别会导致验证码显示为破损图标，
   * 因此这里按文件头魔数判断真实图片类型。
   */
  async _fetchCaptcha(sess: any): Promise<string | null> {
    try {
      const url = /^https?:\/\//i.test(sess.captchaUrl) ? sess.captchaUrl : `${MI_ACCOUNT_ORIGIN}${sess.captchaUrl}`;
      const res = await fetch(url, {
        timeout: 8000,
        headers: { 'User-Agent': MI_USER_AGENT, Cookie: cookieHeader(sess.jar) },
      });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const mime = sniffImageMime(buf);
      if (!mime) return null;
      return `data:${mime};base64,${buf.toString('base64')}`;
    } catch {
      return null;
    }
  }

  /**
   * 登录成功后：换取 serviceToken → 复用 node-mihome 会话 → 抓设备清单落盘。
   * @param serviceToken 已拿到的 serviceToken（二次验证收尾链路里直接取到）；
   *   缺省时按常规流程把 sess.location 交给 node-mihome 的 _loginStep3 去换。
   */
  async _pwdFinish(sess: any, serviceToken?: string): Promise<any> {
    const cloud = this.mihome.miCloudProtocol;
    if (cloud.isLoggedIn) cloud.logout();
    if (!serviceToken) ({ serviceToken } = await cloud._loginStep3(sess.location));
    cloud.ssecurity = sess.ssecurity;
    cloud.userId = sess.userId;
    cloud.serviceToken = serviceToken;
    cloud.username = sess.username;
    cloud.password = sess.password;
    this._pwdCountry = sess.country || 'cn';   // 记下区号，供后续 refreshDevices 复用
    this._useZhLocale();                        // 中文默认名（未自定义名称的设备）

    const list = await cloud.getDevices(null, { country: sess.country });
    const devices = normalizeDevices(list);
    // 拉取家庭归属并写入 homeId，使家庭筛选与「设备状态」栏能按所选家庭收窄
    const homes = await this._fetchPwdHomes();
    if (homes.length) {
      this.saveHomes(homes.map((h) => ({ id: h.id, name: h.name })));
      this._applyHomeIds(devices, homes);
      this._applyRoomIds(devices, homes);
    }
    this.saveDevices(devices);
    this._savePwdSession();
    return { ok: true, source: 'password', count: devices.length, devices };
  }

  /** 清理过期的验证码会话 */
  _prunePwdSessions(): void {
    const now = Date.now();
    for (const [id, s] of this._pwdSessions) {
      if (now - (s.createdAt || 0) > PWD_SESSION_TTL) this._pwdSessions.delete(id);
    }
  }

  // ---------- 二次安全验证（邮箱 / 短信验证码） ----------
  //
  // 触发条件：serviceLoginAuth2 返回 notificationUrl（形如
  // https://account.xiaomi.com/fe/service/identity/authStart?sid=xiaomiio&context=<ctx>&_locale=zh_CN）。
  // 流程参考 Yonsm/MiService（注释标明基于真实设备 MiIO.chls 抓包），共 8 步：
  //   1. GET notificationUrl（/fe/service/identity/authStart）建立验证会话
  //   2. GET /identity/list?sid=<sid>&supportedMask=0&_locale=zh_CN&context=<ctx>
  //      响应顶层 flag：8=邮箱，4=手机短信（注意不是 options 数组）
  //   3. GET /identity/auth/verifyPhone|verifyEmail?_flag=<flag>&_json=true 触发发送
  //   4. （仅手机）POST /identity/auth/sendPhoneTicket（retry=0&icode=&_json=true）真正发出短信
  //   5. 用户输入收到的验证码
  //   6. POST /identity/auth/verifyPhone|verifyEmail?_dc=<毫秒>
  //      body：_flag=<flag>&ticket=<code>&trust=false&_json=true → 成功返回 location
  //   7. GET identity/result/check（不跟随重定向）→ Location 指向 serviceLoginAuth2/end
  //   8. GET serviceLoginAuth2/end（不跟随重定向）→ ssecurity 在 extension-pragma 响应头里，
  //      Location 指向 STS 地址；再 GET STS 地址拿到 serviceToken（详见 _2faFinish）
  //
  // 说明：identity 端点必须用 UA_OTP 风格 UA（与登录 UA 不同），且 cookies 需与登录会话
  //       共用同一个 deviceId（本实现复用 sess.jar，天然一致）。

  /** 触发二次验证：建立会话 → 取验证方式 → 发送验证码 → 返回需要输入验证码 */
  async _2faBegin(sess: any): Promise<any> {
    try {
      await this._2faInit(sess);
    } catch (e) {
      throw new Error(friendlyLoginError(e));
    }
    const data = await this._2faSendTicket(sess);
    return this._2faAfterSend(sess, data);
  }

  /** 步骤 1-2：GET authStart 建立会话 → GET /identity/list 读取顶层 flag 判定验证方式 */
  async _2faInit(sess: any): Promise<void> {
    const startUrl = ensureAbsoluteUrl(sess.notificationUrl);
    const r1 = await this._identityGet(sess, startUrl);
    const t1 = await r1.text();
    console.log('[2fa] authStart url=%s status=%s body=%s', startUrl, r1.status, String(t1).slice(0, 200));

    const listUrl = identityListUrl(sess.notificationUrl);
    const r2 = await this._identityGet(sess, listUrl);
    const t2 = await r2.text();
    console.log('[2fa] list url=%s status=%s body=%s', listUrl, r2.status, String(t2).slice(0, 500));

    const data = parseXiaomiJson(t2);
    const flag = Number(data.flag) || 4;   // 8=邮箱，4=手机短信
    sess.identityFlag = flag;
    sess.identityMethod = flag === 8 ? 'email' : 'phone';
    console.log('[2fa] flag=%s -> method=%s', flag, sess.identityMethod);
  }

  /**
   * 步骤 3-4：触发并发送二次验证码。
   * icode 为「发送所需图形验证码」（小米风控要求时，由用户填图片码后重发）。
   */
  async _2faSendTicket(sess: any, icode?: string): Promise<any> {
    const method = sess.identityMethod === 'phone' ? 'Phone' : 'Email';
    const flag = sess.identityFlag || (sess.identityMethod === 'phone' ? 4 : 8);

    // 步骤 3：GET verifyX?_flag=<flag>&_json=true 触发发送
    const triggerUrl = `${MI_ACCOUNT_ORIGIN}/identity/auth/verify${method}?_flag=${flag}&_json=true`;
    const tresp = await this._identityGetJson(sess, triggerUrl, 'trigger');
    const tcode = Number(tresp.code);
    // 触发本身硬失败（非成功、非图形验证码）时直接返回，交由 _2faAfterSend 报错
    if (tresp.code != null && tcode !== 0 && !(tresp.captchaUrl || tcode === 87001)) return tresp;

    // 步骤 4：真正发出验证码。手机走 sendPhoneTicket；邮箱触发 GET 即发送，
    // 仅当需要图形验证码重发时才走 sendEmailTicket。
    const needSend = sess.identityMethod === 'phone' || !!icode || !!tresp.captchaUrl || tcode === 87001;
    if (needSend) {
      const endpoint = sess.identityMethod === 'phone' ? 'sendPhoneTicket' : 'sendEmailTicket';
      const body = querystring.stringify({ retry: '0', icode: icode || '', _json: 'true' });
      return this._postIdentity(sess, `${MI_ACCOUNT_ORIGIN}/identity/auth/${endpoint}`, body, endpoint);
    }
    return tresp;   // 邮箱：无需额外发送
  }

  /** POST 表单到小米 identity 端点并解析；打印请求/响应便于排查 */
  async _postIdentity(sess: any, url: string, body: string, tag: string): Promise<any> {
    const res = await fetch(url, {
      method: 'POST',
      timeout: 8000,
      headers: { 'User-Agent': MI_OTP_USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader(sess.jar) },
      body,
    });
    absorbSetCookie(sess.jar, res);
    const text = await res.text();
    console.log('[2fa] %s url=%s status=%s body=%s', tag, url, res.status, String(text).slice(0, 500));
    return parseXiaomiJson(text);
  }

  /** 处理发送结果：成功 → needCode；需图形验证码 → needCaptcha(twoFactor) */
  async _2faAfterSend(sess: any, data: any): Promise<any> {
    const code = Number(data && data.code);
    if (code === 0) {
      sess.stage = '2fa_code';
      sess.captchaUrl = null;
      this._pwdSessions.set(sess.id, sess);
      const via = sess.identityMethod === 'phone' ? '短信' : '邮箱';
      return { ok: false, needCode: true, sessionId: sess.id, method: sess.identityMethod, hint: `验证码已发送至绑定的${via}，请查收后输入` };
    }
    if (code === 87001 || (data && data.captchaUrl)) {
      if (!data.captchaUrl) throw new Error('发送验证码失败：需要图形验证码但未获取到，请重试。');
      sess.captchaUrl = data.captchaUrl;
      sess.stage = '2fa_send_captcha';
      this._pwdSessions.set(sess.id, sess);
      return { ok: false, needCaptcha: true, twoFactor: true, sessionId: sess.id, captcha: await this._fetchCaptcha(sess) };
    }
    throw new Error(xiaomiErrText(data));
  }

  /** 提交二次验证码（短信/邮箱）；验证码错误保留会话以便重试 */
  async _2faSubmit(sess: any, ticket: string): Promise<any> {
    let data;
    try {
      data = await this._2faVerify(sess, ticket);
    } catch (e: any) {
      if (e && e.retryCode) {
        const via = sess.identityMethod === 'phone' ? '短信' : '邮箱';
        return { ok: false, needCode: true, sessionId: sess.id, method: sess.identityMethod, hint: `${via}验证码不正确，请重新输入` };
      }
      this._pwdSessions.delete(sess.id);
      throw new Error(friendlyLoginError(e));
    }
    if (data && data.location) sess.identityLocation = data.location;
    if (data && data.userId) sess.userId = data.userId;
    this._pwdSessions.delete(sess.id);
    return this._2faFinish(sess);
  }

  /** 步骤 6：POST verifyX?_dc=<毫秒>，code:0 且返回 location 视为通过，70014 为验证码错误 */
  async _2faVerify(sess: any, ticket: string): Promise<any> {
    const method = sess.identityMethod === 'phone' ? 'Phone' : 'Email';
    const flag = sess.identityFlag || (sess.identityMethod === 'phone' ? 4 : 8);
    const url = `${MI_ACCOUNT_ORIGIN}/identity/auth/verify${method}?_dc=${Date.now()}`;
    const body = querystring.stringify({ _flag: String(flag), ticket, trust: 'false', _json: 'true' });
    const data = await this._postIdentity(sess, url, body, 'verify');
    const code = Number(data && data.code);
    if (code === 0 && data && data.location) return data;
    const err: Error & { retryCode?: boolean } = new Error(xiaomiErrText(data));
    if (code === 70014) err.retryCode = true;
    throw err;
  }

  /**
   * 步骤 7-8：走完二次验证后的会话收尾链路，取出 ssecurity 与 serviceToken。
   *
   * 关键：二次验证通过后返回的 location（identity/result/check?callback=...）**不能**丢弃，
   * 也不能重新裸调 serviceLogin（服务端会以 70016 拒绝）。正确链路（参考
   * Xiaomi-cloud-tokens-extractor 的 do_2fa_email_flow）：
   *   1. GET identity/result/check（不跟随重定向）→ Location 指向 serviceLoginAuth2/end
   *   2. GET serviceLoginAuth2/end（不跟随重定向）→ ssecurity 在 extension-pragma 响应头里，
   *      Location 指向 STS 地址（https://sts.api.io.mi.com/sts）
   *   3. GET STS 地址（逐跳吸收 cookie）→ 拿到 serviceToken
   */
  async _2faFinish(sess: any): Promise<any> {
    const finishLoc = ensureAbsoluteUrl(sess.identityLocation);
    if (!finishLoc) throw new Error('二次验证已完成，但未能获取登录会话，请重试或改用二维码登录。');

    // 第一跳：identity/result/check（不跟随重定向，从响应头取下一跳地址）
    let endUrl = finishLoc;
    if (/identity\/result\/check/i.test(finishLoc)) {
      const r1 = await this._identityGet(sess, finishLoc, 'manual');
      endUrl = r1.headers.get('location') || '';
      console.log('[2fa] result/check status=%s hop=%s', r1.status, endUrl);
    }
    if (!endUrl) throw new Error('二次验证已完成，但未能获取登录会话，请重试或改用二维码登录。');

    // 第二跳：serviceLoginAuth2/end（不跟随重定向）
    // ssecurity 藏在 extension-pragma 响应头；Location 指向 STS 地址。
    const url2 = ensureAbsoluteUrl(endUrl);
    let r2 = await this._identityGet(sess, url2, 'manual');
    let body2 = await r2.text();
    // 服务端偶尔先返回 200 的 Tips 提示页，再取一次才拿到 302
    if (r2.status === 200 && /Xiaomi Account - Tips/i.test(body2)) {
      r2 = await this._identityGet(sess, url2, 'manual');
      body2 = await r2.text();
    }
    const extPrag = r2.headers.get('extension-pragma');
    let ssecurity = '';
    if (extPrag) {
      try { ssecurity = (JSON.parse(extPrag) || {}).ssecurity || ''; } catch { /* ignore */ }
    }
    let stsUrl = r2.headers.get('location') || '';
    if (!stsUrl && body2) {
      const i = body2.indexOf('https://sts.api.io.mi.com/sts');
      if (i !== -1) {
        const j = body2.indexOf('"', i);
        stsUrl = j === -1 ? body2.slice(i, i + 300) : body2.slice(i, j);
      }
    }
    console.log('[2fa] auth2/end status=%s extPrag=%s sts=%s', r2.status, extPrag || '', stsUrl);
    if (!ssecurity || !stsUrl) throw new Error('二次验证已完成，但未能获取登录会话，请重试或改用二维码登录。');

    // 第三跳：GET STS 地址换取 serviceToken（逐跳吸收 set-cookie）
    const r3 = await this._getFollowing(sess, stsUrl, MI_USER_AGENT);
    const serviceToken = sess.jar.serviceToken || '';
    console.log('[2fa] sts status=%s serviceToken=%s', r3 && r3.status, !!serviceToken);
    if (!serviceToken) throw new Error('二次验证已完成，但未能获取登录会话，请重试或改用二维码登录。');

    sess.ssecurity = ssecurity;
    sess.userId = sess.userId || sess.jar.userId || '';
    sess.location = stsUrl;
    return this._pwdFinish(sess, serviceToken);
  }

  /**
   * 手动跟随重定向的 GET：逐跳把 set-cookie 吸收进 jar。
   * node-fetch 默认只暴露最后一跳的 set-cookie，会漏掉 302 上携带的 serviceToken，
   * 因此这里显式逐跳跟随。返回最后一跳的响应（到上限则返回 null）。
   */
  async _getFollowing(sess: any, url: string, userAgent: string, maxHops = 6): Promise<any> {
    let cur = ensureAbsoluteUrl(url);
    for (let i = 0; i < maxHops; i++) {
      const res = await fetch(cur, {
        timeout: 8000,
        redirect: 'manual',
        headers: { 'User-Agent': userAgent, Cookie: cookieHeader(sess.jar) },
      });
      absorbSetCookie(sess.jar, res);
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const loc = res.headers.get('location');
        if (!loc) return res;
        cur = new URL(loc, cur).href;
        continue;
      }
      return res;
    }
    return null;
  }

  /** 带会话 Cookie 的 GET（identity 端点用 UA_OTP，自动吸收 set-cookie） */
  async _identityGet(sess: any, url: string, redirect = 'follow'): Promise<any> {
    const res = await fetch(url, {
      timeout: 8000,
      redirect,
      headers: { 'User-Agent': MI_OTP_USER_AGENT, Cookie: cookieHeader(sess.jar) },
    });
    absorbSetCookie(sess.jar, res);
    return res;
  }

  /** GET identity 端点并解析 JSON（打印请求/响应便于排查） */
  async _identityGetJson(sess: any, url: string, tag: string): Promise<any> {
    const res = await this._identityGet(sess, url);
    const text = await res.text();
    console.log('[2fa] %s url=%s status=%s body=%s', tag, url, res.status, String(text).slice(0, 500));
    return parseXiaomiJson(text);
  }

  // ---------- 二维码登录 ----------

  /** @param onQR 二维码就绪回调 */
  async loginQR(onQR?: (info: { qrImageUrl: string; loginUrl: string }) => void): Promise<any> {
    const api = await this._getApi();
    await api.QRlogin(onQR ? (info: any) => onQR(info) : undefined);
    const devices = await this._fetchCloudDevices(api);
    // 与密码登录路径对齐：补写/落盘家庭归属与家庭清单，避免扫码登录后家庭筛选失效
    const homes = await this._applyCloudHomeIds(api, devices);
    if (homes.length) this.saveHomes(homes);
    await this._applyCloudRooms(api, devices);
    this.saveDevices(devices);
    return { ok: true, source: 'qr', count: devices.length, devices };
  }

  /** 重新拉取设备清单：优先复用进程内的云端会话（密码登录 / 二维码登录），否则回落到本地清单 */
  async refreshDevices(): Promise<any[]> {
    await this.ensurePwdSession();
    const cloud = this._mihome && this._mihome.miCloudProtocol;
    // 密码登录：会话（已落盘并在重启后恢复）在进程内可用，直接用 serviceToken 重新拉取
    if (cloud && cloud.isLoggedIn) {
      this._useZhLocale();   // 中文默认名（未自定义名称的设备）
      const list = await cloud.getDevices(null, { country: this._pwdCountry || 'cn' });
      const devices = normalizeDevices(list);
      const homes = await this._fetchPwdHomes();
      if (homes.length) {
        this.saveHomes(homes.map((h) => ({ id: h.id, name: h.name })));
        this._applyHomeIds(devices, homes);
        this._applyRoomIds(devices, homes);
      }
      return this.saveDevices(devices);
    }
    // 二维码登录：走 @zythum02 的云端会话（auth.json）
    if (await this.hasCloudAuth()) {
      const api = await this._getApi();
      const devices = await this._fetchCloudDevices(api);
      const homes = await this._applyCloudHomeIds(api, devices);
      if (homes.length) this.saveHomes(homes);
      await this._applyCloudRooms(api, devices);
      return this.saveDevices(devices);
    }
    // 无任何云端会话（如重启后仅剩本地清单）：退回本地清单，避免「刷新」直接报错
    const local = this.loadDevices();
    if (local.length) return local;
    throw new Error('尚未登录或登录已过期');
  }

  /**
   * 把密码登录拿到的云端会话落盘（ssecurity / userId / serviceToken），供重启后恢复。
   * serviceToken 有效期通常数月，过期后请求会失败，此时重新登录即可。
   */
  _savePwdSession(): void {
    const cloud = this._mihome && this._mihome.miCloudProtocol;
    if (!cloud || !cloud.serviceToken || !cloud.ssecurity) return;
    try {
      fs.mkdirSync(this.cloudDir, { recursive: true });
      fs.writeFileSync(this.sessionFile, JSON.stringify({
        username: cloud.username || '',
        userId: cloud.userId || '',
        ssecurity: cloud.ssecurity,
        serviceToken: cloud.serviceToken,
        country: this._pwdCountry || 'cn',
        savedAt: Date.now(),
      }, null, 2), 'utf8');
    } catch { /* 落盘失败不影响本次登录 */ }
  }

  /** 进程内无云端会话时，尝试用落盘的密码登录会话恢复；返回是否可用 */
  async ensurePwdSession(): Promise<boolean> {
    const cloud = this.mihome.miCloudProtocol;
    this._useZhLocale();   // 无论新建还是恢复会话，都确保返回中文默认名
    if (cloud.isLoggedIn) return true;
    let s;
    try { s = JSON.parse(fs.readFileSync(this.sessionFile, 'utf8')); } catch { return false; }
    if (!s || !s.ssecurity || !s.serviceToken) return false;
    cloud.ssecurity = s.ssecurity;
    cloud.userId = s.userId || '';
    cloud.serviceToken = s.serviceToken;
    cloud.username = s.username || cloud.username;
    this._pwdCountry = s.country || 'cn';
    return true;
  }

  async _fetchCloudDevices(api: any): Promise<any[]> {
    const [own, shared] = await Promise.all([
      api.getDevicesList().catch(() => []),
      api.getSharedDevicesList().catch(() => []),
    ]);
    return normalizeDevices([...own, ...shared]);
  }

  // ---------- 云端属性读写（MiioProvider 的云回退用） ----------

  /**
   * 云端请求兜底：命中 code=3「auth error」时强制刷新会话并重试一次。
   *
   * 背景：@zythum02/mijia-api 的 available 只表示「本地有凭证」，凭证过期后仍返回 true，
   * 其 refreshToken() 也会因此直接短路返回，于是所有云端请求恒返回 code=3。
   * 只能走云端的设备（蓝牙温湿度计等）因此永远拿不到数据，界面停在「--」。
   * 这里显式重走一遍 serviceLogin 刷新 Cookie 并重建会话；失败则一分钟内不再重试，避免刷屏。
   */
  async _cloudCall<T>(run: (api: any) => Promise<T>): Promise<T> {
    const api = await this._getApi();
    if (!api.available) throw new Error('云端会话不可用');
    try {
      return await run(api);
    } catch (e) {
      if (!isCloudAuthError(e)) throw e;
      if (Date.now() - this._refreshAt < REFRESH_COOLDOWN) throw e;
      this._refreshAt = Date.now();
      if (!(await this._forceRefreshSession(api))) throw e;
      return run(api);
    }
  }

  /** 强制刷新云端会话（并发请求共用同一次刷新）。@returns 是否刷新成功 */
  _forceRefreshSession(api: any): Promise<boolean> {
    if (this._cloudRefresh) return this._cloudRefresh;
    this._cloudRefresh = (async () => {
      try {
        if (typeof api._getLocation !== 'function') return false;
        await api._getLocation();   // 重走 serviceLogin，用 Set-Cookie 换取新凭证
        if (typeof api._initSession === 'function') api._initSession();
        if (typeof api._saveAuthData === 'function') api._saveAuthData();
        return true;
      } catch {
        return false;
      } finally {
        this._cloudRefresh = null;
      }
    })();
    return this._cloudRefresh;
  }

  async cloudGet(props: unknown): Promise<unknown> {
    return this._cloudCall((api) => api.getDevicesProp(props));
  }

  async cloudSet(prop: unknown): Promise<unknown> {
    return this._cloudCall((api) => api.setDevicesProp(prop));
  }

  /** 云动作调用（如风扇手动上下左右），param = {did, siid, aiid, value?} */
  async cloudAction(param: unknown): Promise<unknown> {
    return this._cloudCall((api) => api.runAction(param));
  }

  // ---------- 登出 ----------

  async logout(): Promise<{ ok: boolean }> {
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
    try { fs.rmSync(this.sessionFile, { force: true }); } catch { /* ignore */ }
    return { ok: true };
  }
}

/**
 * 把抛出的错误翻译成用户能看懂的中文提示。
 * 新流程本身抛出的已是中文化、有意义的错误，这里只兜底网络类错误。
 */
function friendlyLoginError(e: any): string {
  const msg = (e && e.message) ? String(e.message) : String(e || '');
  if (/ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|timeout|network|fetch failed/i.test(msg)) {
    return '网络连接失败，请检查网络后重试。';
  }
  return msg || '登录失败，请重试。';
}

/**
 * 是否为云端「认证失效」错误。
 * 小米云在凭证过期时统一返回 code=3 / message="auth error"，
 * 与设备离线、参数错误等业务失败要区分开，只有前者值得强制刷新会话。
 */
function isCloudAuthError(e: any): boolean {
  if (!e) return false;
  if (Number(e.code) === 3) return true;
  return /auth error|认证失败|登录已过期/i.test(String(e.message || ''));
}

/** 剥离小米云响应体前缀 `&&&START&&&` 后解析 JSON（部分端点为 `&&&START&&&{...}`） */
function parseXiaomiJson(text: any): any {
  if (!text) return {};
  let s = String(text).trim();
  const marker = '&&&START&&&';
  const idx = s.indexOf(marker);
  if (idx >= 0) s = s.slice(idx + marker.length).trim();
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/** 补全小米账号相对地址为绝对地址 */
function ensureAbsoluteUrl(url: any): string {
  const s = String(url || '');
  if (!s) return s;
  if (/^https?:\/\//i.test(s)) return s;
  return `${MI_ACCOUNT_ORIGIN}${s.startsWith('/') ? '' : '/'}${s}`;
}

/** authStart → /identity/list（带 sid/supportedMask/_locale/context），用于查询可用的二次验证方式 */
function identityListUrl(notificationUrl: any): string {
  let sid = 'xiaomiio';
  let context = '';
  try {
    const u = new URL(notificationUrl, MI_ACCOUNT_ORIGIN);
    sid = u.searchParams.get('sid') || sid;
    context = u.searchParams.get('context') || '';
  } catch { /* 用默认值 */ }
  return `${MI_ACCOUNT_ORIGIN}/identity/list?sid=${encodeURIComponent(sid)}&supportedMask=0&_locale=zh_CN&context=${encodeURIComponent(context)}`;
}

/** 组装请求 Cookie 头（跳过空值） */
function cookieHeader(jar: any): string {
  return Object.entries(jar || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

/** 按文件头魔数判断图片真实类型；无法识别返回 null */
function sniffImageMime(buf: any): string | null {
  if (!buf || buf.length < 4) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
  if (buf[0] === 0x42 && buf[1] === 0x4d) return 'image/bmp';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

/** 吸收响应 set-cookie 里的 name=value 到 jar（小米账号风控依赖 deviceId 等 cookie） */
function absorbSetCookie(jar: any, res: any): void {
  try {
    const raw = (res.headers.raw && res.headers.raw()['set-cookie']) || [];
    for (const line of raw) {
      const pair = String(line).split(';')[0];
      const eq = pair.indexOf('=');
      if (eq <= 0) continue;
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (name) jar[name] = value;
    }
  } catch { /* ignore */ }
}

/** 把小米账号接口返回的错误对象翻译成中文提示 */
function xiaomiErrText(data: any): string {
  const d = data || {};
  const desc = String(d.desc || d.description || '').trim();
  const code = Number(d.code);
  if (code === 70016) return '账号或密码不正确，请检查后重试。';
  if (code === 87001) return '图形验证码不正确，请重新输入。';
  if (code === 70003) return '账号不存在，请检查小米账号。';
  if (code === 70008) return '登录尝试次数过多，请稍后再试。';
  if (code === 70014) return '验证码不正确，请重新输入。';
  if (code === 70022) return String(d.tips || desc || '验证码发送失败，请稍后再试。');
  // 小米在“需要图形验证码/校验未通过”时会返回 code:0 且 desc 为“成功”，
  // 绝不能把这类成功字样当作错误提示展示给用户。
  if (code === 0 || /^(成功|ok|success)$/i.test(desc)) {
    return '登录未完成：未获取到登录会话，请重试或改用二维码登录。';
  }
  return desc || '登录失败，请重试。';
}

/**
 * 归一化设备：兼容 node-mihome(/home/device_list) 与
 * @zythum02(/home/home_device_list) 两种云端返回的字段差异。
 */
function normalizeDevices(list: any[]): any[] {
  const out: any[] = [];
  const seen = new Set<string>();
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
      roomId: d.room_id || d.roomId || '',
      roomName: d.room_name || d.roomName || '',
    });
  }
  return out;
}

export { MijiaLogin, normalizeDevices };

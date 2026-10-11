'use strict';

const EventEmitter = require('events');
const path = require('path');
const { getSpec, analyze } = require('./miot-spec');

/**
 * 设备数据源（可插拔）。
 *
 * 接口契约（渲染层完全无感知数据来源）：
 *   - 继承 EventEmitter，数据变化时 emit('update', snapshot())
 *   - start() / stop() / snapshot()
 *   - setPower(id, on) / setBrightness(id, value) / setColorTemperature(id, value) / setSpeed(id, value)
 *
 * 共有两个实现：
 *   1. MockProvider —— 模拟数据，用于没登录时跑通 UI。
 *   2. MiioProvider —— 真实设备：登录阶段已自动抓到 token，这里走
 *      「局域网 miIO 直连优先，云端回退」。
 *
 * 关于「所有设备都支持」：
 *   型号不写死。运行时按 model 去 miot-spec 拉规格（src/miot-spec.js），
 *   再按属性名（on / brightness / temperature ...）自动映射读写。
 *   现实边界：Wi-Fi 设备可局域网直连；ZigBee 子设备需经网关、BLE 设备
 *   不支持局域网，这两类会自动回退到云端。
 */

class MockProvider extends EventEmitter {
  constructor() {
    super();
    this.source = 'mock';
    this.devices = [
      {
        id: 'sensor-living',
        type: 'sensor',
        name: '客厅温湿度',
        model: '米家温湿度计 3',
        online: true,
        battery: 87,
        temperature: 25.4,
        humidity: 53,
      },
      {
        id: 'plug-desk',
        type: 'plug',
        name: '桌面插座',
        model: '米家智能插座 3',
        online: true,
        on: true,
        power: 42.6,
        todayKwh: 0.38,
      },
      {
        id: 'light-study',
        type: 'light',
        name: '书房台灯',
        model: '米家台灯 1S',
        online: true,
        on: true,
        brightness: 72,
        colorTemperature: 4000,
        colorTempRange: [2700, 6500],
      },
      {
        id: 'fan-bedroom',
        type: 'fan',
        name: '卧室风扇',
        model: '米家智能风扇',
        online: true,
        on: true,
        speed: 2,
        speedRange: [0, 3],
        speedList: ['1 档', '2 档', '3 档', '4 档'],
        speedStepless: 60,
        speedSteplessRange: [1, 100],
        mode: 0,
        modeList: [
          { value: 0, description: '直吹风' },
          { value: 1, description: '自然风' },
        ],
        horizontalSwing: false,
        horizontalSwingAngle: 60,
        horizontalSwingAngleList: [
          { value: 30, description: '30°' },
          { value: 60, description: '60°' },
          { value: 90, description: '90°' },
          { value: 120, description: '120°' },
        ],
        verticalSwing: false,
        verticalSwingAngle: 90,
        verticalSwingAngleList: [
          { value: 30, description: '30°' },
          { value: 60, description: '60°' },
          { value: 90, description: '90°' },
          { value: 100, description: '100°' },
        ],
        manualDir: true,
        lastManualDir: '',
      },
      {
        id: 'aircon-living',
        type: 'aircon',
        name: '客厅空调',
        model: '小米空调巨省电 1匹',
        online: true,
        on: true,
        mode: 2,
        modeList: [
          { value: 2, description: '制冷' },
          { value: 3, description: '除湿' },
          { value: 4, description: '送风' },
          { value: 5, description: '制热' },
        ],
        targetTemperature: 26,
        targetTempRange: [16, 31],
        speed: 0,
        speedRange: [0, 8],
        speedList: null,
        verticalSwing: true,
        verticalSwingAngle: 0,
        verticalSwingAngleList: [
          { value: 0, description: '关闭' },
          { value: 2, description: '上' },
          { value: 3, description: '中' },
          { value: 4, description: '下' },
          { value: 7, description: '上偏' },
          { value: 8, description: '下偏' },
        ],
        temperature: 27.5,
        humidity: 48,
      },
      {
        id: 'purifier-desk',
        type: 'purifier',
        name: '台式净饮机',
        model: '米家台式净饮机 制冰版',
        online: true,
        on: true,           // 声音开关
        status: 1,
        statusList: [
          { value: 1, description: '待机中' },
          { value: 2, description: '出水中' },
          { value: 3, description: '冲洗中' },
          { value: 4, description: '休眠中' },
          { value: 5, description: '异常中' },
          { value: 6, description: '排空完成' },
        ],
        fault: 0,
        iceMakerOn: false,
        iceMakerStatus: 0,
        iceMakerStatusList: [
          { value: 0, description: '空闲' },
          { value: 1, description: '制冰中' },
          { value: 2, description: '定时制冰中' },
          { value: 3, description: '冰满' },
          { value: 4, description: '定时冰满' },
        ],
        mode: 0,
        modeList: [
          { value: 0, description: '正常' },
          { value: 1, description: '快速' },
        ],
        targetTemperature: 0,
        targetTempRange: [0, 95],
        temperature: 25,
        filterLife: 88,
        tdsIn: 120,
        tdsOut: 15,
      },
    ];
    this.timer = null;
  }

  start() {
    this.timer = setInterval(() => this.tick(), 3000);
    return this;
  }

  stop() {
    clearInterval(this.timer);
  }

  tick() {
    for (const d of this.devices) {
      if (d.type === 'sensor') {
        d.temperature = clamp(round1(d.temperature + rnd(-0.25, 0.25)), 18, 32);
        d.humidity = clamp(Math.round(d.humidity + rnd(-1.5, 1.5)), 25, 80);
        if (Math.random() < 0.02) d.battery = clamp(d.battery - 1, 1, 100);
      }
      if (d.type === 'plug' && d.on) {
        d.power = clamp(round1(d.power + rnd(-6, 6)), 4, 320);
        d.todayKwh = round2(d.todayKwh + d.power / 3600 / 1000 * 3);
      }
      if (d.type === 'plug' && !d.on) d.power = 0;
    }
    this.emit('update', this.snapshot());
  }

  snapshot() {
    return this.devices.map((d) => ({ ...d }));
  }

  setPower(id, on) {
    const d = this.devices.find((x) => x.id === id);
    if (!d || !['plug', 'light', 'fan', 'aircon', 'purifier'].includes(d.type)) return;
    d.on = !!on;
    if (d.type === 'plug') d.power = d.on ? round1(rnd(15, 60)) : 0;
    this.emit('update', this.snapshot());
  }

  /** 通用字段写入（枚举/布尔/数值），用于空调/风扇/净饮机的多维调节 */
  setField(id, field, value) {
    const d = this.devices.find((x) => x.id === id);
    if (!d) return;
    d[field] = value;
    if (field === 'iceMakerOn') {
      // 模拟：开启 3 秒后进入「制冰中」，再 6 秒「冰满」
      if (value) {
        d.iceMakerStatus = 1;
        setTimeout(() => { d.iceMakerStatus = 3; this.emit('update', this.snapshot()); }, 6000);
      } else {
        d.iceMakerStatus = 0;
      }
    }
    this.emit('update', this.snapshot());
  }

  setBrightness(id, value) {
    const d = this.devices.find((x) => x.id === id);
    if (!d || d.type !== 'light') return;
    d.brightness = clamp(Math.round(value), 1, 100);
    if (d.brightness > 0) d.on = true;
    this.emit('update', this.snapshot());
  }

  setColorTemperature(id, value) {
    const d = this.devices.find((x) => x.id === id);
    if (!d || d.type !== 'light' || !d.colorTempRange) return;
    d.colorTemperature = clamp(Math.round(value), d.colorTempRange[0], d.colorTempRange[1]);
    this.emit('update', this.snapshot());
  }

  setSpeed(id, value) {
    const d = this.devices.find((x) => x.id === id);
    if (!d || d.type !== 'fan') return;
    const [min, max] = d.speedRange || [0, 100];
    d.speed = clamp(Math.round(value), min, max);
    if (d.speed > min) d.on = true;
    this.emit('update', this.snapshot());
  }

  /** 手动风向（动作）：mock 下只记录最近一次调节，便于界面反馈 */
  callAction(id, key) {
    const d = this.devices.find((x) => x.id === id);
    if (!d) return;
    d.lastManualDir = key;
    this.emit('update', this.snapshot());
  }
}

/**
 * 真实设备 Provider。
 *
 * 数据来源分两段：
 *   - 「配网阶段」由 MijiaLogin 完成：登录云账号后把设备清单（含 did/ip/token/model）
 *     落盘到 {dataDir}/devices.json。
 *   - 「运行阶段」就是本类：直接读那份清单做局域网 miIO 直连，无需再次登录。
 */
class MiioProvider extends EventEmitter {
  /** @param {{dataDir:string, login:import('./mijia-login').MijiaLogin, homeId?:string}} opts */
  constructor({ dataDir, login, homeId }) {
    super();
    this.source = 'miio';
    this.dataDir = dataDir;
    this.login = login;
    this.homeId = homeId ? String(homeId) : '';   // 仅展示该家庭下的设备；空则展示全部
    // 规格缓存复用二维码会话的磁盘缓存目录（可离线复用已抓过的型号）
    this.specCacheDir = path.join(dataDir, 'cloud');
    this.devices = [];        // 渲染层使用的设备对象
    this.binds = new Map();   // id -> 绑定信息（含 ip/token/props/reads）
    this.timer = null;
    this.pollMs = 5000;
    this._polling = false;
    this._miioReady = false;
  }

  get mihome() {
    return require('node-mihome');
  }

  /** 读取清单 + 逐台解析规格，构建绑定。返回 this 以便链式调用。 */
  async build() {
    let list = this.login.loadDevices();
    // 选定家庭后，只构建该家庭下的设备（homeId 为空则展示全部）
    if (this.homeId) list = list.filter((d) => String(d.homeId || '') === this.homeId);
    for (const d of list) {
      const info = await getSpec(d.model, this.specCacheDir);
      const { type, props, reads, actions } = analyze(info);
      // 从规格里取「取值区间」或「枚举项」，供渲染层滑杆使用
      const rangeOf = (f) => {
        const p = props[f];
        if (!p) return null;
        if (p.range && p.range.length >= 2) return [p.range[0], p.range[1]];
        if (p.list && p.list.length) return [0, p.list.length - 1];
        return null;
      };
      const listOf = (f) => (props[f] && props[f].list) || null;
      this.devices.push({
        id: d.id,
        type,
        name: d.name,
        model: d.model,
        online: d.online !== false,
        on: false,
        brightness: 0,
        colorTemperature: 0,
        colorTempRange: rangeOf('colorTemperature'),
        colorTempList: listOf('colorTemperature'),
        speed: 0,
        speedRange: rangeOf('speed'),
        speedList: listOf('speed'),
        // 直吹风无极风速（与档位风速并存）
        speedStepless: 0,
        speedSteplessRange: rangeOf('speedStepless'),
        speedSteplessList: listOf('speedStepless'),
        power: 0,
        todayKwh: 0,
        temperature: null,
        humidity: null,
        battery: null,
        // 空调 / 风扇
        mode: null,
        modeList: listOf('mode'),
        targetTemperature: null,
        targetTempRange: rangeOf('targetTemperature'),
        horizontalSwing: props.horizontalSwing ? false : null,
        horizontalSwingAngle: props.horizontalSwingAngle ? 0 : null,
        horizontalSwingAngleList: listOf('horizontalSwingAngle'),
        verticalSwing: props.verticalSwing ? false : null,
        verticalSwingAngle: props.verticalSwingAngle ? 0 : null,
        verticalSwingAngleList: listOf('verticalSwingAngle'),
        // 风扇手动风向（动作）是否可用
        manualDir: ['turnLeft', 'turnRight', 'turnUpward', 'turnDownward'].some((k) => actions[k]),
        // 净饮机
        iceMakerOn: null,
        iceMakerStatus: null,
        iceMakerStatusList: listOf('iceMakerStatus'),
        status: null,
        statusList: listOf('status'),
        fault: null,
        faultList: listOf('fault'),
        faultLabel: '',
        noWater: false,
        filterLife: null,
        tdsIn: null,
        tdsOut: null,
      });
      this.binds.set(d.id, {
        id: d.id,
        did: d.id,
        name: d.name,
        model: d.model,
        ip: d.ip,
        token: d.token,
        parentId: d.parentId,
        type,
        props,
        reads,
        actions,
      });
    }
    return this;
  }

  start() {
    try {
      this.mihome.miioProtocol.init();
      this._miioReady = true;
    } catch {
      this._miioReady = false;
    }
    // 为具备局域网条件的设备注册凭据（ip + token）
    for (const b of this.binds.values()) {
      if (!this._lanUsable(b)) continue;
      try {
        this.mihome.miioProtocol.updateDevice(b.ip, { id: Number(b.did), token: b.token });
      } catch { /* 单台注册失败不影响其它设备 */ }
    }
    this.timer = setInterval(() => this.tick(), this.pollMs);
    this.tick();   // 立即拉一次
    return this;
  }

  stop() {
    clearInterval(this.timer);
    if (this._miioReady) {
      try { this.mihome.miioProtocol.destroy(); } catch { /* ignore */ }
    }
  }

  snapshot() {
    return this.devices.map((d) => ({ ...d }));
  }

  /* ---------------- 控制 ---------------- */

  setPower(id, on) {
    const b = this.binds.get(id);
    if (!b || !this._writable(b, 'on')) return;
    this._write(b, 'on', !!on);
  }

  setBrightness(id, value) {
    const b = this.binds.get(id);
    if (!b || !this._writable(b, 'brightness')) return;
    const v = clamp(Math.round(value), 1, 100);
    this._write(b, 'brightness', v);
    const dev = this._dev(id);
    if (dev && v > 0) dev.on = true;
  }

  setColorTemperature(id, value) {
    const b = this.binds.get(id);
    if (!b || !this._writable(b, 'colorTemperature')) return;
    const p = b.props.colorTemperature;
    let v = Math.round(value);
    if (p.range && p.range.length >= 2) v = clamp(v, p.range[0], p.range[1]);
    this._write(b, 'colorTemperature', v);
  }

  setSpeed(id, value) {
    const b = this.binds.get(id);
    if (!b || !this._writable(b, 'speed')) return;
    const p = b.props.speed;
    let v = Math.round(value);
    if (p.range && p.range.length >= 2) v = clamp(v, p.range[0], p.range[1]);
    else if (p.list && p.list.length) v = clamp(v, 0, p.list.length - 1);
    this._write(b, 'speed', v);
    const dev = this._dev(id);
    if (dev && v > 0) dev.on = true;
  }

  /**
   * 通用字段写入：空调模式/温度/摆风、风扇双向摆风与自然风、净饮机制冰开关等。
   * 布尔直接透传；带 range 的数值做区间裁剪；枚举按调用方给出的原始值透传。
   */
  setField(id, field, value) {
    const b = this.binds.get(id);
    if (!b || !this._writable(b, field)) return;
    const p = b.props[field];
    let v = value;
    if (typeof value !== 'boolean') {
      const n = Number(value);
      if (!Number.isFinite(n)) return;
      if (p.range && p.range.length >= 2) v = clamp(n, p.range[0], p.range[1]);
      else v = n;
    }
    this._write(b, field, v);
  }

  /**
   * 动作调用（如风扇手动上下左右）：米家规格里方向调节是 action，需按 siid/aiid 调用。
   * node-mihome 未提供通用 action 协议，统一走云端 runAction。
   */
  async callAction(id, key) {
    const b = this.binds.get(id);
    const act = b && b.actions && b.actions[key];
    if (!act) return;
    const dev = this._dev(id);
    try {
      await this._cloudAction(b, { did: b.did, siid: act.siid, aiid: act.aiid });
      if (dev) dev.online = true;
    } catch {
      if (dev) dev.online = false;
    }
    this.emit('update', this.snapshot());
  }

  /* ---------------- 轮询 ---------------- */

  async tick() {
    if (this._polling) return;
    this._polling = true;
    try {
      await Promise.all(this.devices.map((dev) => this._pollDevice(dev)));
    } finally {
      this._polling = false;
      this.emit('update', this.snapshot());
    }
  }

  async _pollDevice(dev) {
    const b = this.binds.get(dev.id);
    if (!b || !b.reads.length) return;   // 无规格可读：保持云端给出的在线状态
    const params = b.reads.map((r) => ({ did: b.did, siid: r.siid, piid: r.piid }));

    // 1) 局域网直连
    if (this._lanUsable(b)) {
      try {
        const res = await this.mihome.miioProtocol.send(b.ip, 'get_properties', params, { retries: 0 });
        this._applyResults(dev, b, res);
        dev.online = true;
        return;
      } catch { /* 局域网失败，转云端 */ }
    }

    // 2) 云端回退
    try {
      const res = await this._cloudGet(b, params);
      this._applyResults(dev, b, res);
      dev.online = true;
      return;
    } catch { /* 都失败 */ }

    dev.online = false;
  }

  /* ---------------- 读写底层 ---------------- */

  async _write(b, field, value) {
    const p = b.props[field];
    if (!p) return;
    const dev = this._dev(b.id);

    // 1) 局域网直连
    if (this._lanUsable(b)) {
      try {
        await this.mihome.miioProtocol.send(
          b.ip,
          'set_properties',
          [{ did: b.did, siid: p.siid, piid: p.piid, value }],
          { retries: 1 },
        );
        if (dev) { dev.online = true; this._setField(dev, field, value, b); }
        this.emit('update', this.snapshot());
        return;
      } catch { /* 转云端 */ }
    }

    // 2) 云端回退
    try {
      await this._cloudSet(b, { did: b.did, siid: p.siid, piid: p.piid, value });
      if (dev) { dev.online = true; this._setField(dev, field, value, b); }
    } catch {
      if (dev) dev.online = false;
    }
    this.emit('update', this.snapshot());
  }

  /** 云读：优先 @zythum02 二维码会话，其次 node-mihome 密码会话 */
  async _cloudGet(b, params) {
    if (await this.login.hasCloudAuth()) {
      const res = await this.login.cloudGet(params);
      return Array.isArray(res) ? res : [res];
    }
    const cloud = this.mihome.miCloudProtocol;
    if (cloud.isLoggedIn) {
      const res = await cloud.miioCall(b.did, 'get_properties', params);
      return Array.isArray(res) ? res : [res];
    }
    throw new Error('无可用云端会话');
  }

  /** 云写：同上两条路径 */
  async _cloudSet(b, param) {
    if (await this.login.hasCloudAuth()) {
      return this.login.cloudSet(param);
    }
    const cloud = this.mihome.miCloudProtocol;
    if (cloud.isLoggedIn) {
      return cloud.miioCall(b.did, 'set_properties', [param]);
    }
    throw new Error('无可用云端会话');
  }

  /** 云动作：仅支持 @zythum02 云端会话（runAction） */
  async _cloudAction(b, param) {
    if (await this.login.hasCloudAuth()) {
      return this.login.cloudAction(param);
    }
    throw new Error('无可用云端会话');
  }

  /* ---------------- 工具 ---------------- */

  _dev(id) {
    return this.devices.find((x) => x.id === id);
  }

  _lanUsable(b) {
    return !!(b.ip && b.token);
  }

  _writable(b, field) {
    const p = b.props[field];
    return !!p && String(p.rw || '').includes('w');
  }

  _applyResults(dev, b, results) {
    for (const r of results || []) {
      if (!r || r.code !== 0) continue;
      for (const [field, p] of Object.entries(b.props)) {
        if (p.siid === r.siid && p.piid === r.piid) {
          this._setField(dev, field, r.value, b);
        }
      }
    }
  }

  /** 从规格 value-list 里取某原始值的描述文案 */
  _labelOf(b, field, value) {
    const p = b && b.props[field];
    if (!p || !p.list) return '';
    const hit = p.list.find((it) => String(it.value) === String(value));
    return hit ? hit.description : '';
  }

  _setField(dev, field, value, b) {
    switch (field) {
      case 'on': dev.on = !!value; break;
      case 'brightness': dev.brightness = clamp(Math.round(Number(value) || 0), 0, 100); break;
      case 'colorTemperature': dev.colorTemperature = Math.round(Number(value) || 0); break;
      case 'speed': dev.speed = Math.round(Number(value) || 0); break;
      case 'speedStepless': dev.speedStepless = Math.round(Number(value) || 0); break;
      case 'temperature': dev.temperature = round1(Number(value)); break;
      case 'humidity': dev.humidity = Math.round(Number(value)); break;
      case 'battery': dev.battery = clamp(Math.round(Number(value)), 0, 100); break;
      case 'power': dev.power = round1(Number(value) || 0); break;
      case 'todayKwh': dev.todayKwh = round2((Number(value) || 0) / 1000); break; // Wh → kWh
      // 空调 / 风扇
      case 'mode': dev.mode = Number(value); break;
      case 'targetTemperature': dev.targetTemperature = round1(Number(value) || 0); break;
      case 'horizontalSwing': dev.horizontalSwing = !!value; break;
      case 'horizontalSwingAngle': dev.horizontalSwingAngle = Number(value); break;
      case 'verticalSwing': dev.verticalSwing = !!value; break;
      case 'verticalSwingAngle': dev.verticalSwingAngle = Number(value); break;
      // 净饮机
      case 'iceMakerOn': dev.iceMakerOn = !!value; break;
      case 'iceMakerStatus': dev.iceMakerStatus = Number(value); break;
      case 'status': dev.status = Number(value); break;
      case 'fault': {
        const raw = Number(value);
        dev.fault = Number.isFinite(raw) ? raw : value;
        dev.faultLabel = this._labelOf(b, 'fault', value) || (value === '' || value == null ? '' : String(value));
        // 缺水判定：7=水箱自来水区缺水，26=水箱自来水区缺水（另 1=无水箱 / 8=无纯水壶 也算缺水异常）
        dev.noWater = [7, 26].includes(raw);
        break;
      }
      case 'filterLife': dev.filterLife = clamp(Math.round(Number(value) || 0), 0, 100); break;
      case 'tdsIn': dev.tdsIn = Math.round(Number(value) || 0); break;
      case 'tdsOut': dev.tdsOut = Math.round(Number(value) || 0); break;
      default: break;
    }
  }
}

/**
 * 按是否存在已登录的设备清单选择实现。
 * 有清单（登录过）→ MiioProvider 局域网直连；否则 → MockProvider 演示数据。
 * @param {{dataDir?:string, login?:object, homeId?:string}} [opts]
 */
async function createProvider(opts = {}) {
  const { dataDir, login, homeId } = opts;
  if (login && login.hasDevices() && login.loadDevices().length) {
    const p = new MiioProvider({ dataDir, login, homeId });
    await p.build();
    return p;
  }
  return new MockProvider();
}

const rnd = (min, max) => Math.random() * (max - min) + min;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const round1 = (v) => Math.round(v * 10) / 10;
const round2 = (v) => Math.round(v * 100) / 100;

module.exports = { createProvider, MockProvider, MiioProvider };

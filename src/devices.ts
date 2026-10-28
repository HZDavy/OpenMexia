import { EventEmitter } from 'events';
import * as path from 'path';
import * as os from 'os';
import { getSpec, analyze } from './miot-spec';
import type {
  Device,
  DeviceAction,
  DeviceProperty,
  DeviceRecord,
  DeviceType,
} from '../shared/types';
import type { MijiaLogin } from './mijia-login';

/** 连续这么多次探测失败才把设备标成离线（轮询 5 秒一轮，约 15 秒）。 */
const POLL_FAILURES_BEFORE_OFFLINE = 3;

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
 *   型号不写死。运行时按 model 去 miot-spec 拉规格（src/miot-spec.ts），
 *   再按属性名（on / brightness / temperature ...）自动映射读写。
 *   现实边界：Wi-Fi 设备可局域网直连；ZigBee 子设备需经网关、BLE 设备
 *   不支持局域网，这两类会自动回退到云端。
 */

/** 单台设备的绑定信息（id -> 绑定），MiioProvider 内部读写用 */
interface Bind {
  id: string;
  did: string;
  name: string;
  model: string;
  ip?: string;
  token?: string;
  parentId?: string;
  type: DeviceType;
  props: Record<string, DeviceProperty>;
  reads: { siid: number; piid: number }[];
  actions: Record<string, DeviceAction>;
  /** Yeelight 系灯具标注的传统局域网协议；其余为 null */
  lanProto: string | null;
}

/** createProvider / MiioProvider 的构造参数 */
interface ProviderOptions {
  dataDir: string;
  login: MijiaLogin;
  homeId?: string;
}

class MockProvider extends EventEmitter {
  source: string;
  devices: any[];
  timer: ReturnType<typeof setInterval> | null;

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
        filterLife2: 92,
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
    clearInterval(this.timer ?? undefined);
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

  setPower(id: string, on: boolean) {
    const d = this.devices.find((x) => x.id === id);
    if (!d || !['plug', 'light', 'fan', 'aircon', 'purifier'].includes(d.type)) return;
    d.on = !!on;
    if (d.type === 'plug') d.power = d.on ? round1(rnd(15, 60)) : 0;
    this.emit('update', this.snapshot());
  }

  /** 通用字段写入（枚举/布尔/数值），用于空调/风扇/净饮机的多维调节 */
  setField(id: string, field: string, value: any) {
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

  setBrightness(id: string, value: number) {
    const d = this.devices.find((x) => x.id === id);
    if (!d || d.type !== 'light') return;
    d.brightness = clamp(Math.round(value), 1, 100);
    if (d.brightness > 0) d.on = true;
    this.emit('update', this.snapshot());
  }

  setColorTemperature(id: string, value: number) {
    const d = this.devices.find((x) => x.id === id);
    if (!d || d.type !== 'light' || !d.colorTempRange) return;
    d.colorTemperature = clamp(Math.round(value), d.colorTempRange[0], d.colorTempRange[1]);
    this.emit('update', this.snapshot());
  }

  setSpeed(id: string, value: number) {
    const d = this.devices.find((x) => x.id === id);
    if (!d || d.type !== 'fan') return;
    const [min, max] = d.speedRange || [0, 100];
    d.speed = clamp(Math.round(value), min, max);
    if (d.speed > min) d.on = true;
    this.emit('update', this.snapshot());
  }

  /** 手动风向（动作）：mock 下只记录最近一次调节，便于界面反馈 */
  callAction(id: string, key: string) {
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
  source: string;
  dataDir: string;
  login: MijiaLogin;
  homeId: string;
  specCacheDir: string;
  devices: Device[];
  binds: Map<string, Bind>;
  timer: ReturnType<typeof setInterval> | null;
  pollMs: number;
  _polling: boolean;
  _pollFailures: Map<string, number>;
  _miioReady: boolean;
  _localSubnets: Set<string>;

  constructor({ dataDir, login, homeId }: ProviderOptions) {
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
    this._pollFailures = new Map();
    this._miioReady = false;
    // 本机网卡的 /24 前缀集合：只有与设备同网段时，局域网直连的探测结果才可信
    this._localSubnets = hostSubnets();
  }

  get mihome(): any {
    return require('node-mihome');
  }

  /** 读取清单 + 逐台解析规格，构建绑定。返回 this 以便链式调用。 */
  async build(): Promise<this> {
    // 无二维码会话时，尝试恢复密码登录的云端会话（落盘在 cloud/session.json），
    // 以便跨网段设备仍能走云端回退读取状态，而不是被误判为离线。
    try { await this.login.ensurePwdSession(); } catch { /* 无会话则仅靠局域网直连 */ }
    let list = this.login.loadDevices();
    // 选定家庭后，只构建该家庭下的设备（homeId 为空则展示全部）。
    // 注意：node-mihome 的 /home/device_list（密码登录）不返回 home_id，此时清单里所有设备的
    // homeId 都是空串，家庭筛选无从判断——若仍按 homeId 过滤会把设备全部滤掉、界面整片空白，
    // 因此当清单中没有任何设备带 homeId 时直接展示全部。
    if (this.homeId && list.some((d: DeviceRecord) => String(d.homeId || '') !== '')) {
      list = list.filter((d: DeviceRecord) => String(d.homeId || '') === this.homeId);
    }
    for (const d of list) {
      const info = await getSpec(d.model, this.specCacheDir);
      const { type, props, reads, actions } = analyze(info, d.model);
      // 从规格里取「取值区间」或「枚举项」，供渲染层滑杆使用
      const rangeOf = (f: string): [number, number] | null => {
        const p = props[f];
        if (!p) return null;
        if (p.range && p.range.length >= 2) return [p.range[0], p.range[1]];
        if (p.list && p.list.length) return [0, p.list.length - 1];
        return null;
      };
      const listOf = (f: string) => (props[f] && props[f].list) || null;
      this.devices.push({
        id: d.id,
        type,
        name: d.name,
        model: d.model,
        // 房间归属（来自云端 gethome / homelist 的 roomlist），供按房间分类展示
        roomId: String(d.roomId || ''),
        roomName: String(d.roomName || ''),
        // 初始在线状态取自云端清单（isOnline），随后由轮询（局域网直连 / 云端回退）
        // 用真实探测结果校正。清单里标为离线的设备先按离线展示，避免「离线却显示在线」。
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
        filterLife2: null,
        tdsIn: null,
        tdsOut: null,
        // 路由器 / 网关（只读指标）
        connectedDeviceNumber: null,
        downloadSpeed: null,
        uploadSpeed: null,
        // 规格里是否带网络指标（路由器），渲染层据此决定展示哪些读数
        hasNetMetrics: !!(props.connectedDeviceNumber || props.downloadSpeed || props.uploadSpeed),
        // 规格里是否有可读属性；无（如计时器 hoto.timer.kt、青萍网关 cgllc.gateway.s1，
        // 规格里 properties 为空）时渲染层只显示「在线/离线」并提示暂不支持读取状态。
        hasReads: reads.length > 0,
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
        // Yeelight 系灯具固件普遍只实现传统 Yeelight 局域网协议（get_prop / set_power /
        // set_bright / set_ct_abx），而不实现 MIoT-spec 的 get_properties/set_properties。
        // 例如吸顶灯（yeelink.light.ceiling22）走 MIoT 读必 2s 超时、写必 4s 超时，
        // 表现为「卡且控制不了」。这里对 Yeelight 灯具标注局域网协议，读写优先走传统协议。
        lanProto: String(d.model || '').startsWith('yeelink.light.') ? 'yeelight' : null,
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
    clearInterval(this.timer ?? undefined);
    if (this._miioReady) {
      try { this.mihome.miioProtocol.destroy(); } catch { /* ignore */ }
    }
  }

  snapshot(): Device[] {
    return this.devices.map((d) => ({ ...d }));
  }

  /* ---------------- 控制 ---------------- */

  setPower(id: string, on: boolean) {
    const b = this.binds.get(id);
    if (!b || !this._writable(b, 'on')) return;
    this._write(b, 'on', !!on);
  }

  setBrightness(id: string, value: number) {
    const b = this.binds.get(id);
    if (!b || !this._writable(b, 'brightness')) return;
    const v = clamp(Math.round(value), 1, 100);
    this._write(b, 'brightness', v);
    const dev = this._dev(id);
    if (dev && v > 0) dev.on = true;
  }

  setColorTemperature(id: string, value: number) {
    const b = this.binds.get(id);
    if (!b || !this._writable(b, 'colorTemperature')) return;
    const p = b.props.colorTemperature;
    let v = Math.round(value);
    if (p.range && p.range.length >= 2) v = clamp(v, p.range[0], p.range[1]);
    this._write(b, 'colorTemperature', v);
  }

  setSpeed(id: string, value: number) {
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
  setField(id: string, field: string, value: any) {
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
  async callAction(id: string, key: string) {
    const b = this.binds.get(id);
    const act = b && b.actions && b.actions[key];
    if (!act) return;
    const dev = this._dev(id);
    try {
      await this._cloudAction(b as Bind, { did: (b as Bind).did, siid: act.siid, aiid: act.aiid });
      if (dev) dev.online = true;
    } catch (e: any) {
      // 与轮询一致：仅在云端「明确」判定离线时才置离线，避免动作偶发失败把在线设备误判为离线
      if (dev && e && e.deviceOffline) dev.online = false;
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

  /** 探测成功：清零失败计数并标记在线。 */
  _markOnline(dev: Device) {
    dev.online = true;
    this._pollFailures.delete(dev.id);
  }

  /**
   * 探测失败：云端明确判定离线时立即置离线；超时、会话异常等不确定的失败
   * 累计到阈值再置离线——设备真断网几天不会一直显示在线，偶发抖动也不会误判。
   */
  _markPollFailure(dev: Device, offline: boolean) {
    if (offline) {
      dev.online = false;
      this._pollFailures.delete(dev.id);
      return;
    }
    const count = (this._pollFailures.get(dev.id) || 0) + 1;
    this._pollFailures.set(dev.id, count);
    if (count >= POLL_FAILURES_BEFORE_OFFLINE) dev.online = false;
  }

  async _pollDevice(dev: Device) {
    const b = this.binds.get(dev.id);
    if (!b || !b.reads.length) return;   // 无规格可读：保持云端清单给出的在线状态
    const params = b.reads.map((r) => ({ did: b.did, siid: r.siid, piid: r.piid }));

    // 1) 局域网直连（仅当设备与本机同网段时才尝试，避免跨网段必然超时）
    //    同网段设备局域网读不到，通常就是它真的不在线；云端对离线设备会回放缓存值，
    //    所以这一步的结果不能再用「云端读成功」覆盖掉。
    let lanAttempted = false;
    if (this._lanUsable(b) && this._sameSubnet(b.ip)) {
      lanAttempted = true;
      // Yeelight 灯具优先走传统局域网协议读取（MIoT-spec 读在部分固件上必超时）
      if (b.lanProto === 'yeelight') {
        try {
          await this._yeelightRead(b, dev);
          this._markOnline(dev);
          return;
        } catch { /* 回退 MIoT-spec / 云端 */ }
      }
      try {
        const res = await this.mihome.miioProtocol.send(b.ip, 'get_properties', params, { retries: 0 });
        this._applyResults(dev, b, res);
        this._markOnline(dev);
        return;
      } catch { /* 转云端 */ }
    }

    // 2) 云端回退（需有可用云端会话：密码登录会话或二维码会话），由云端给出权威判定
    const cloudUsable = this.mihome.miCloudProtocol.isLoggedIn
      || await this.login.hasCloudAuth();
    if (cloudUsable) {
      try {
        const res = await this._cloudGet(b, params);
        this._applyResults(dev, b, res);
        if (lanAttempted) {
          // 同网段设备局域网已经读不到：云端这时多半只是在回放旧缓存，
          // 不能凭它把设备当成在线，累计几次就按离线展示。
          this._markPollFailure(dev, false);
        } else {
          this._markOnline(dev);
        }
      } catch (e: any) {
        // 云端明确判定离线（如路由器 3040「已离线」、-2「device offline」）立即置离线；
        // 应答超时 / 会话异常等不确定的失败累计到阈值才置离线，避免偶发抖动误判。
        this._markPollFailure(dev, !!(e && e.deviceOffline));
      }
      return;
    }

    // 既没有局域网条件也没有云端会话：连续探测不到就按离线展示，避免设备
    // 断网后一直沿用清单里的旧「在线」状态。
    this._markPollFailure(dev, false);
  }

  /* ---------------- 读写底层 ---------------- */

  async _write(b: Bind, field: string, value: any) {
    const p = b.props[field];
    if (!p) return;
    const dev = this._dev(b.id);
    const lan = this._lanUsable(b) && this._sameSubnet(b.ip);

    // 1) Yeelight 传统局域网协议（灯类：MIoT-spec 写在部分固件上必超时）
    if (lan && b.lanProto === 'yeelight') {
      try {
        await this._yeelightWrite(b, field, value);
        if (dev) { dev.online = true; this._setField(dev, field, value, b); }
        this.emit('update', this.snapshot());
        return;
      } catch { /* 回退 MIoT-spec / 云端 */ }
    }

    // 2) MIoT-spec 局域网直连（仅同网段；跨网段必然超时，直接走云端）
    if (lan) {
      try {
        await this.mihome.miioProtocol.send(
          b.ip,
          'set_properties',
          [{ did: b.did, siid: p.siid, piid: p.piid, value }],
          { retries: 0 },
        );
        if (dev) { dev.online = true; this._setField(dev, field, value, b); }
        this.emit('update', this.snapshot());
        return;
      } catch { /* 转云端 */ }
    }

    // 3) 云端回退
    try {
      await this._cloudSet(b, { did: b.did, siid: p.siid, piid: p.piid, value });
      if (dev) { dev.online = true; this._setField(dev, field, value, b); }
    } catch (e: any) {
      // 与轮询一致：仅在云端「明确」判定离线时才置离线，避免写入偶发失败把在线设备误判为离线
      if (dev && e && e.deviceOffline) dev.online = false;
    }
    this.emit('update', this.snapshot());
  }

  /**
   * Yeelight 传统局域网读：get_prop 返回字符串数组，顺序与请求一致。
   * 请求 ['power','bright','ct'] → ['off', '100', '3200']。
   * 仅灯类使用；非灯类实现由调用方保证不进入本方法。
   */
  async _yeelightRead(b: Bind, dev: Device) {
    const res = await this.mihome.miioProtocol.send(
      b.ip, 'get_prop', ['power', 'bright', 'ct'], { retries: 0 },
    );
    if (!Array.isArray(res) || res.length < 2) throw new Error('legacy get_prop 返回异常');
    this._setField(dev, 'on', String(res[0]) === 'on', b);
    this._setField(dev, 'brightness', Number(res[1]), b);
    if (b.props.colorTemperature) this._setField(dev, 'colorTemperature', Number(res[2]), b);
    return res;
  }

  /** Yeelight 传统局域网写：on → set_power / brightness → set_bright / colorTemperature → set_ct_abx */
  async _yeelightWrite(b: Bind, field: string, value: any) {
    const send = (method: string, params: any[]) =>
      this.mihome.miioProtocol.send(b.ip, method, params, { retries: 0 });
    if (field === 'on') return send('set_power', [value ? 'on' : 'off', 'smooth', 500]);
    if (field === 'brightness') return send('set_bright', [Math.round(value), 'smooth', 500]);
    if (field === 'colorTemperature') return send('set_ct_abx', [Math.round(value), 'smooth', 500]);
    throw new Error(`legacy 协议不支持字段 ${field}`);
  }

  /**
   * 云读：优先 @zythum02 二维码会话，其次 node-mihome 密码会话。
   * 蓝牙（BLE，did 形如 blt.*）设备不支持 /home/rpc 的 RPC（云端会返回
   * 「bluetooth device does not support sending rpc」），需改用 MIoT-spec 云端点
   * /miotspec/prop/get；其余设备的 /home/rpc 路径保留原有的「明确离线」判定语义。
   * 仅当云端「明确」判定设备离线（如 3040「设备/路由器已离线」、-2「device offline」、
   * 文案含「离线/offline」）时才抛带 deviceOffline 的错误；应答超时、BLE 不支持 RPC、
   * 会话异常等情况抛普通错误，交由调用方保持原有在线状态，避免把在线设备误判为离线。
   */
  async _cloudGet(b: Bind, params: { did: string; siid: number; piid: number }[]) {
    if (await this.login.hasCloudAuth()) {
      const res = await this.login.cloudGet(params);
      const arr = Array.isArray(res) ? res : [res];
      // 二维码会话走 /miotspec/prop/get：离线设备会在批量结果里返回错误码 -704042011「设备离线」，
      // 且常与若干 code=0 的缓存值并存。必须优先判定离线，否则会因「存在 code=0」而把离线设备误判为在线。
      if (arr.some((r: any) => isDeviceOfflineCode(Number(r && r.code)))) {
        const err: Error & { deviceOffline?: boolean } = new Error('设备离线');
        err.deviceOffline = true;
        throw err;
      }
      if (!arr.some((r: any) => r && Number(r.code) === 0)) throw new Error('云端未返回有效属性');
      return arr;
    }
    const cloud = this.mihome.miCloudProtocol;
    if (!cloud.isLoggedIn) throw new Error('无可用云端会话');
    const country = (this.login && this.login._pwdCountry) || 'cn';
    // BLE 设备走 MIoT-spec 云端点（/home/rpc 对蓝牙设备直接拒绝）
    const isBle = /^blt\./i.test(String(b.did || ''));
    const data = isBle
      ? await cloud.request('/miotspec/prop/get', { params, datasource: 1 }, country)
      : await cloud.request(`/home/rpc/${b.did}`, { method: 'get_properties', params }, country);
    if (data && data.result) {
      return Array.isArray(data.result) ? data.result : [data.result];
    }
    const code = data && Number(data.code);
    const msg = [data && (data.message || data.msg), data && data.error && data.error.message]
      .filter(Boolean).join(' ');
    if (code === 3040 || code === -2 || /离线|offline/i.test(msg)) {
      const err: Error & { deviceOffline?: boolean } = new Error('设备离线');
      err.deviceOffline = true;
      throw err;
    }
    throw new Error(`云端未返回属性（code=${code}${msg ? ' ' + msg : ''}）`);
  }

  /**
   * 云写：优先 @zythum02 二维码会话，其次 node-mihome 密码会话。
   * 与 _cloudGet 同理：蓝牙（BLE，did 形如 blt.*）设备不支持 /home/rpc 的 RPC，
   * 需改用 MIoT-spec 云端点 /miotspec/prop/set；其余设备沿用 /home/rpc。
   */
  async _cloudSet(b: Bind, param: { did: string; siid: number; piid: number; value: any }) {
    if (await this.login.hasCloudAuth()) {
      return this.login.cloudSet(param);
    }
    const cloud = this.mihome.miCloudProtocol;
    if (!cloud.isLoggedIn) throw new Error('无可用云端会话');
    const country = (this.login && this.login._pwdCountry) || 'cn';
    const isBle = /^blt\./i.test(String(b.did || ''));
    return isBle
      ? cloud.request('/miotspec/prop/set', { params: [param] }, country)
      : cloud.miioCall(b.did, 'set_properties', [param]);
  }

  /**
   * 云动作（如风扇手动上下左右）：优先 @zythum02 二维码会话（runAction）；
   * 否则走 node-mihome 密码会话的 MIoT 云端点 /miotspec/action。
   * 注意该端点的 params 必须是「对象」而非数组，数组会返回 -8「data type not valid」。
   */
  async _cloudAction(b: Bind, param: { did: string; siid: number; aiid: number }) {
    if (await this.login.hasCloudAuth()) {
      return this.login.cloudAction(param);
    }
    const cloud = this.mihome.miCloudProtocol;
    if (cloud.isLoggedIn) {
      const country = (this.login && this.login._pwdCountry) || 'cn';
      return cloud.request('/miotspec/action', {
        params: { did: param.did, siid: param.siid, aiid: param.aiid, in: [] },
      }, country);
    }
    throw new Error('无可用云端会话');
  }

  /* ---------------- 工具 ---------------- */

  _dev(id: string): Device | undefined {
    return this.devices.find((x) => x.id === id);
  }

  _lanUsable(b: Bind) {
    return !!(b.ip && b.token);
  }

  /** 设备 IP 是否与本机网卡处于同一 /24 网段（IPv4） */
  _sameSubnet(ip?: string) {
    const p = ipv4Prefix(ip);
    return !!p && this._localSubnets.has(p);
  }

  _writable(b: Bind, field: string) {
    const p = b.props[field];
    return !!p && String(p.rw || '').includes('w');
  }

  _applyResults(dev: Device, b: Bind, results: any) {
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
  _labelOf(b: Bind, field: string, value: any) {
    const p = b && b.props[field];
    if (!p || !p.list) return '';
    const hit = p.list.find((it) => String(it.value) === String(value));
    return hit ? hit.description : '';
  }

  _setField(dev: Device, field: string, value: any, b: Bind) {
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
      case 'filterLife2': dev.filterLife2 = clamp(Math.round(Number(value) || 0), 0, 100); break;
      case 'tdsIn': dev.tdsIn = Math.round(Number(value) || 0); break;
      case 'tdsOut': dev.tdsOut = Math.round(Number(value) || 0); break;
      // 路由器 / 网关（只读指标）
      case 'connectedDeviceNumber': dev.connectedDeviceNumber = Math.round(Number(value) || 0); break;
      case 'downloadSpeed': dev.downloadSpeed = round1(Number(value) || 0); break;
      case 'uploadSpeed': dev.uploadSpeed = round1(Number(value) || 0); break;
      default: break;
    }
  }
}

/**
 * 按是否存在已登录的设备清单选择实现。
 * 有清单（登录过）→ MiioProvider 局域网直连；否则 → MockProvider 演示数据。
 */
async function createProvider(opts: Partial<ProviderOptions> = {}): Promise<MockProvider | MiioProvider> {
  const { dataDir, login, homeId } = opts;
  if (login && login.hasDevices() && login.loadDevices().length) {
    const p = new MiioProvider({ dataDir: dataDir as string, login, homeId });
    await p.build();
    return p;
  }
  return new MockProvider();
}

const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;

/** 小米 IoT 云端错误码：设备离线。二维码会话的 /miotspec/prop/get 批量结果里会以该码返回。 */
function isDeviceOfflineCode(code: number): boolean {
  return code === -704042011;
}

/** 取 IPv4 的 /24 前缀（如 "192.168.0.5" → "192.168.0"）；非 IPv4 返回 '' */
function ipv4Prefix(ip?: string): string {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$/.exec(String(ip || '').trim());
  return m ? `${m[1]}.${m[2]}.${m[3]}` : '';
}

/** 本机所有非回环 IPv4 网卡的 /24 前缀集合 */
function hostSubnets(): Set<string> {
  const set = new Set<string>();
  const nics = os.networkInterfaces();
  for (const list of Object.values(nics)) {
    for (const ni of list || []) {
      if (ni && ni.family === 'IPv4' && !ni.internal) {
        const p = ipv4Prefix(ni.address);
        if (p) set.add(p);
      }
    }
  }
  return set;
}

export { createProvider, MockProvider, MiioProvider };

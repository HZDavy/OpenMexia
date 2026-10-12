/**
 * 领域模型契约 —— 主进程 / preload / 渲染层共用的数据结构。
 *
 * 本文件是纯声明（.d.ts）：不参与编译、不改任何运行时行为。
 * 主进程与 preload 的 JS 通过 JSDoc `import('./types').Xxx` 直接消费这些类型；
 * 后续把文件逐个转成 .ts 时，同样可直接 import。
 */

/** 设备品类（由 miot-spec 的 analyze() 按规格推断） */
export type DeviceType =
  | 'sensor'
  | 'plug'
  | 'light'
  | 'fan'
  | 'aircon'
  | 'purifier'
  | 'router'
  | 'gateway'
  | 'other';

/** 规格里的枚举项（滑杆档位等） */
export interface PropertyItem {
  value: number | string;
  description: string;
}

/** 规格解析出的「可读写属性」绑定 */
export interface DeviceProperty {
  siid: number;
  piid: number;
  /** 读写标记，含 'r' / 'w' */
  rw: string;
  range: number[] | null;
  list: PropertyItem[] | null;
}

/** 规格解析出的动作绑定（如风扇手动上下左右） */
export interface DeviceAction {
  siid: number;
  aiid: number;
}

/** miot-spec.analyze() 的返回结构 */
export interface SpecAnalysis {
  type: DeviceType;
  props: Record<string, DeviceProperty>;
  reads: { siid: number; piid: number }[];
  actions: Record<string, DeviceAction>;
}

/** 渲染层使用的设备对象（devices.js 构建，轮询过程中持续更新） */
export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  model: string;
  /** 房间归属（来自云端 gethome / homelist 的 roomlist），供按房间分类展示 */
  roomId: string;
  roomName: string;
  online: boolean;
  on: boolean;

  brightness: number;
  colorTemperature: number;
  colorTempRange: [number, number] | null;
  colorTempList: PropertyItem[] | null;

  speed: number;
  speedRange: [number, number] | null;
  speedList: PropertyItem[] | null;
  speedStepless: number;
  speedSteplessRange: [number, number] | null;
  speedSteplessList: PropertyItem[] | null;

  power: number;
  todayKwh: number;
  temperature: number | null;
  humidity: number | null;
  battery: number | null;

  // 空调 / 风扇
  mode: string | number | null;
  modeList: PropertyItem[] | null;
  targetTemperature: number | null;
  targetTempRange: [number, number] | null;
  horizontalSwing: boolean | null;
  horizontalSwingAngle: number | null;
  horizontalSwingAngleList: PropertyItem[] | null;
  verticalSwing: boolean | null;
  verticalSwingAngle: number | null;
  verticalSwingAngleList: PropertyItem[] | null;
  manualDir: boolean;

  // 净饮机
  iceMakerOn: boolean | null;
  iceMakerStatus: number | null;
  iceMakerStatusList: PropertyItem[] | null;
  status: number | null;
  statusList: PropertyItem[] | null;
  fault: number | null;
  faultList: PropertyItem[] | null;
  faultLabel: string;
  noWater: boolean;
  filterLife: number | null;
  tdsIn: number | null;
  tdsOut: number | null;

  // 路由器 / 网关（只读指标）
  connectedDeviceNumber: number | null;
  downloadSpeed: number | null;
  uploadSpeed: number | null;
  hasNetMetrics: boolean;

  /** 规格里是否有可读属性；无则渲染层只显示在线/离线 */
  hasReads: boolean;
}

/** 应用设置（主进程内存态，落盘于 widget-state.json） */
export interface Settings {
  alwaysOnTop: boolean;
  launchAtLogin: boolean;
}

/** 家庭 */
export interface Home {
  id: string;
  name: string;
}

/** 登录状态汇总（mijia-login.status() 返回） */
export interface LoginStatus {
  hasDevices: boolean;
  deviceCount: number;
  cloudAuth: boolean;
  passwordSession: boolean;
  homes: Home[];
}

/** 对渲染层广播的登录状态（在 LoginStatus 上追加运行时字段） */
export interface LoginState extends LoginStatus {
  isMock: boolean;
  currentHomeId?: string;
}

/** 设备清单里的一条记录（mijia-login 归一化后落盘） */
export interface DeviceRecord {
  id: string;
  name: string;
  model: string;
  did?: string;
  ip?: string;
  token?: string;
  parentId?: string;
  homeId?: string;
  roomId?: string;
  roomName?: string;
  online?: boolean;
  [k: string]: unknown;
}

/** 二维码就绪信息 */
export interface QRInfo {
  qrImageUrl?: string;
  loginUrl?: string;
  /** 由主进程用 loginUrl 本地生成的 dataURL 兜底 */
  dataUrl?: string;
}

/** 密码登录续步：需要图形验证码 */
export interface LoginNeedCaptcha {
  ok: false;
  needCaptcha: true;
  sessionId: string;
  captcha: string;
}
/** 密码登录续步：需要二次安全验证码 */
export interface LoginNeedCode {
  ok: false;
  needCode: true;
  sessionId: string;
  method: string;
  hint: string;
}
/** 登录成功（密码 / 二维码） */
export interface LoginSuccess {
  ok: true;
  source: 'password' | 'qr';
  count: number;
  devices: DeviceRecord[];
}
export type LoginResponse = LoginNeedCaptcha | LoginNeedCode | LoginSuccess;

/** 全屏模式：null 未全屏；'normal' 任务栏可见；'cover' 盖住任务栏 */
export type FullscreenMode = 'normal' | 'cover' | null;

/** 主题 */
export type Theme = 'light' | 'dark';

/** 窗口模式：'window' 正常窗口（任务栏可见、无托盘）；'widget' 小组件（工具窗口 + 托盘） */
export type WindowMode = 'window' | 'widget';

/** widget:init 的返回值 */
export interface InitPayload {
  devices: Device[];
  settings: Settings;
  isMock: boolean;
  login: LoginStatus;
  currentHomeId: string;
  hasCustomSize: boolean;
  fullscreen: FullscreenMode;
  theme: Theme;
  windowMode: WindowMode;
  version: string;
}

/** widget:check-update 的返回值 */
export interface UpdateResult {
  hasUpdate?: boolean;
  version?: string;
  url?: string;
  [k: string]: unknown;
}

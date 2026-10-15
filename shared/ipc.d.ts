/**
 * IPC 契约 —— 渲染层 ↔ 主进程的全部通道与调用签名。
 *
 * 纯声明（.d.ts），不参与编译、不改运行时。
 * preload.js 用 JSDoc 的 `@type` 标注把暴露对象声明为 `IpcApi` 后，
 * 通道名拼写错误、参数类型不符都会在 `npm run typecheck` 时报错。
 */

import type {
  Device,
  FullscreenMode,
  Home,
  InitPayload,
  LoginResponse,
  LoginState,
  QRInfo,
  Settings,
  Theme,
  UpdateResult,
  WindowMode,
} from './types';

/**
 * 应用内弹出菜单的定位方式：
 *   'below-right' —— 锚点作为菜单内容右上角（右上角汉堡按钮下方）；
 *   'at'          —— 锚点作为菜单内容左上角（右键 / 跟随鼠标）。
 */
export type MenuPlace = 'below-right' | 'at';

/** 渲染层请求弹出菜单时交给主进程的载荷（菜单 HTML 已序列化） */
export interface OpenMenuPayload {
  kind: 'app' | 'ctx';
  html: string;                          // 序列化后的菜单元素 outerHTML（含 data-menu-key 标记）
  anchor: { x: number; y: number };      // 锚点屏幕坐标（DIP）
  place: MenuPlace;
  theme: Theme;
}

/** 主进程 → 弹出菜单窗口：渲染这份菜单，附带本次会话 id（用于丢弃过期消息） */
export interface PopupMenuData extends OpenMenuPayload {
  id: number;
}

/** 独立弹窗的种类（与主窗口脱钩、不受主窗口尺寸约束） */
export type DialogKind = 'login' | 'about' | 'pin';

/** 主进程 → 独立弹窗窗口：渲染哪一张卡片 + 当前主题与版本号 */
export interface DialogData {
  id: number;
  kind: DialogKind;
  theme: Theme;
  version: string;
}

/** 全部 IPC 通道（含主窗口 ↔ 渲染层、主进程 ↔ 弹出菜单窗口） */
export type IpcChannel =
  // ---- 渲染层 → 主进程：invoke（有返回值） ----
  | 'widget:init'
  | 'widget:login-status'
  | 'widget:login-password'
  | 'widget:login-captcha'
  | 'widget:login-refresh-captcha'
  | 'widget:login-qr'
  | 'widget:refresh-devices'
  | 'widget:logout'
  | 'widget:get-homes'
  | 'widget:set-home'
  | 'widget:check-update'
  // ---- 渲染层 → 主进程：send（无返回值） ----
  | 'widget:set-power'
  | 'widget:set-brightness'
  | 'widget:set-color-temperature'
  | 'widget:set-speed'
  | 'widget:set-field'
  | 'widget:call-action'
  | 'widget:hide'
  | 'widget:resize'
  | 'widget:quit'
  | 'widget:toggle-top'
  | 'widget:toggle-login'
  | 'widget:send-screen'
  | 'widget:fullscreen'
  | 'widget:set-theme'
  | 'widget:menu-icons'
  | 'widget:pin-taskbar'
  | 'widget:open-external'
  | 'widget:toggle-window-mode'
  | 'widget:room-state'
  // ---- 渲染层 → 主进程：弹出菜单（独立窗口） ----
  | 'widget:open-menu'
  | 'widget:close-menu'
  // ---- 渲染层 → 主进程：独立弹窗（登录 / 关于 / 固定到任务栏，与主窗口脱钩） ----
  | 'widget:open-dialog'
  | 'widget:close-dialog'
  // ---- 主进程 → 渲染层：主进程主动推送 ----
  | 'widget:devices'
  | 'widget:settings'
  | 'widget:fullscreen-state'
  | 'widget:open-panel'
  | 'widget:toggle-theme'
  | 'widget:titlebar-menu'
  | 'widget:qr'
  | 'widget:login-state'
  | 'widget:window-mode'
  | 'widget:toggle-room'
  | 'widget:menu-action'
  | 'widget:menu-closed'
  // ---- 主进程 → 主窗口：独立弹窗开/关（主窗口据此显示黑色遮罩） ----
  | 'widget:dialog-open'
  | 'widget:dialog-closed'
  // ---- 主进程 ↔ 弹出菜单窗口（内部通道） ----
  | 'menu:data'
  | 'menu:size'
  | 'menu:action'
  | 'menu:shown'
  // ---- 主进程 ↔ 独立弹窗窗口（内部通道） ----
  | 'dialog:data'
  | 'dialog:size'
  | 'dialog:shown'
  | 'dialog:reset'
  | 'dialog:close';

/**
 * `window.mijia` 的调用面（由 preload.js 的 contextBridge 暴露）。
 * 渲染层用 `window.mijia.xxx(...)`，主进程用相同通道号 `ipcMain` 侧实现。
 */
export interface IpcApi {
  // ---- 初始化与订阅 ----
  init(): Promise<InitPayload>;
  onDevices(cb: (devices: Device[]) => void): void;
  onSettings(cb: (settings: Settings) => void): void;

  // ---- 设备控制 ----
  setPower(id: string, on: boolean): void;
  setBrightness(id: string, value: number): void;
  setColorTemperature(id: string, value: number): void;
  setSpeed(id: string, value: number): void;
  setField(id: string, field: string, value: unknown): void;
  callAction(id: string, key: string): void;

  // ---- 窗口 / 外观 ----
  hide(): void;
  resize(height: number): void;
  quit(): void;
  setTheme(theme: Theme): void;
  toggleOnTop(): void;
  pinTaskbar(): void;
  toggleLogin(): void;
  sendToSecondScreen(): void;
  fullscreen(mode: Exclude<FullscreenMode, null>): void;
  onFullscreenState(cb: (mode: FullscreenMode) => void): void;
  setMenuIcons(icons: Record<string, string>): void;
  // 窗口模式 / 小组件模式切换（主进程负责改窗口属性与托盘，渲染层同步菜单文案）
  toggleWindowMode(): void;
  onWindowMode(cb: (mode: WindowMode) => void): void;
  // 渲染层上报房间显示偏好（托盘菜单同步勾选态与文案）；托盘点击回传 'group' | 'name'
  reportRoomState(state: { groupByRoom: boolean; showRoomName: boolean }): void;
  onToggleRoom(cb: (which: 'group' | 'name') => void): void;

  // ---- 托盘 / 菜单联动 ----
  onOpenPanel(cb: (name: 'login' | 'home' | 'hidden') => void): void;
  onToggleTheme(cb: () => void): void;
  onTitlebarMenu(cb: (pt: { x: number; y: number }) => void): void;

  // ---- 应用内弹出菜单（独立窗口，不受主窗口边界裁剪） ----
  // 主窗口渲染层：请求弹出 / 收起菜单，接收菜单项回传与「已收起」通知
  openMenu(payload: OpenMenuPayload): void;
  closeMenu(): void;
  onMenuAction(cb: (key: string) => void): void;
  onMenuClosed(cb: () => void): void;
  // 弹出菜单窗口：接收菜单数据、回传内容尺寸、回传被点击项的 key（空串 = 点空白收起）
  onMenuData(cb: (data: PopupMenuData) => void): void;
  menuSize(width: number, height: number, id: number): void;
  menuAction(key: string, id: number): void;
  // 弹出菜单窗口：主进程已把窗口显示出来 → 开始单次入场淡入（避免 CSS 动画在显隐切换时重放闪烁）
  onMenuShown(cb: () => void): void;

  // ---- 独立弹窗（登录 / 关于 / 固定到任务栏，与主窗口脱钩、不受主窗口尺寸约束） ----
  // 主窗口渲染层：请求打开 / 关闭弹窗，接收弹窗开/关通知（用于控制黑色遮罩）
  openDialog(kind: DialogKind): void;
  closeDialog(): void;
  onDialogOpen(cb: (kind: DialogKind) => void): void;
  onDialogClosed(cb: () => void): void;
  // 独立弹窗窗口：接收渲染数据、回传卡片尺寸、请求关闭
  onDialogData(cb: (data: DialogData) => void): void;
  dialogSize(width: number, height: number, id: number): void;
  dialogClose(): void;
  // 独立弹窗窗口：主进程已把窗口显示出来 → 开始单次入场淡入（同菜单窗口，避免显隐切换时动画重放闪烁）
  onDialogShown(cb: () => void): void;
  // 独立弹窗窗口：收起前先清空内容并回到透明态（趁窗口仍可见时真实绘制一帧），
  // 避免隐藏窗口保留上一次的卡片帧、下次打开被复用显示时闪一下旧内容
  onDialogReset(cb: () => void): void;

  // ---- 关于窗口 ----
  openExternal(url: string): void;
  checkUpdate(): Promise<UpdateResult>;

  // ---- 登录 / 设备管理 ----
  loginStatus(): Promise<LoginState>;
  loginPassword(payload: { username: string; password: string; country?: string }): Promise<LoginResponse>;
  loginCaptcha(payload: { sessionId: string; code: string }): Promise<LoginResponse>;
  loginRefreshCaptcha(payload: { sessionId: string }): Promise<LoginResponse>;
  loginQR(): Promise<LoginResponse>;
  refreshDevices(): Promise<{ ok: true; count: number }>;
  logout(): Promise<{ ok: true }>;
  getHomes(): Promise<{ homes: Home[]; currentHomeId: string }>;
  setHome(homeId: string): Promise<{ ok: true; currentHomeId: string }>;
  onQR(cb: (info: QRInfo) => void): void;
  onLoginState(cb: (state: LoginState) => void): void;
}

/** Provider 的公共接口（devices.js 的 MockProvider / MiioProvider 实现） */
export interface Provider {
  source: string;
  build(): Promise<Provider>;
  start(): Provider;
  stop(): void;
  snapshot(): Device[];
  on(event: 'update', cb: (devices: Device[]) => void): void;
  setPower(id: string, on: boolean): unknown;
  setBrightness(id: string, value: number): unknown;
  setColorTemperature(id: string, value: number): unknown;
  setSpeed(id: string, value: number): unknown;
  setField?(id: string, field: string, value: unknown): unknown;
  callAction?(id: string, key: string): unknown;
}

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
} from './types';

/** 全部 IPC 通道（渲染层 → 主进程 29 个，主进程 → 渲染层 9 个） */
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
  | 'widget:pin-taskbar-done'
  | 'widget:open-external'
  // ---- 主进程 → 渲染层：主进程主动推送 ----
  | 'widget:devices'
  | 'widget:settings'
  | 'widget:fullscreen-state'
  | 'widget:open-pin-guide'
  | 'widget:open-panel'
  | 'widget:toggle-theme'
  | 'widget:titlebar-menu'
  | 'widget:qr'
  | 'widget:login-state';

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
  pinTaskbarDone(): void;
  toggleLogin(): void;
  sendToSecondScreen(): void;
  fullscreen(mode: Exclude<FullscreenMode, null>): void;
  onFullscreenState(cb: (mode: FullscreenMode) => void): void;
  setMenuIcons(icons: Record<string, string>): void;

  // ---- 托盘 / 菜单联动 ----
  onOpenPinGuide(cb: () => void): void;
  onOpenPanel(cb: (name: 'login' | 'home' | 'hidden') => void): void;
  onToggleTheme(cb: () => void): void;
  onTitlebarMenu(cb: (pt: { x: number; y: number }) => void): void;

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

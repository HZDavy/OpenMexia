import { contextBridge, ipcRenderer } from 'electron';
import type { IpcApi } from './shared/ipc';

// 暴露给渲染层的调用面，必须与 shared/ipc.d.ts 的 IpcApi 保持一致。
// 通道名拼错、参数签名不符都会在 `npm run typecheck` 时报错。
contextBridge.exposeInMainWorld('mijia', {
  init: () => ipcRenderer.invoke('widget:init'),
  onDevices: (cb) => ipcRenderer.on('widget:devices', (_e, devices) => cb(devices)),
  onSettings: (cb) => ipcRenderer.on('widget:settings', (_e, settings) => cb(settings)),
  setPower: (id, on) => ipcRenderer.send('widget:set-power', { id, on }),
  setBrightness: (id, value) => ipcRenderer.send('widget:set-brightness', { id, value }),
  setColorTemperature: (id, value) => ipcRenderer.send('widget:set-color-temperature', { id, value }),
  setSpeed: (id, value) => ipcRenderer.send('widget:set-speed', { id, value }),
  setField: (id, field, value) => ipcRenderer.send('widget:set-field', { id, field, value }),
  callAction: (id, key) => ipcRenderer.send('widget:call-action', { id, key }),
  hide: () => ipcRenderer.send('widget:hide'),
  resize: (height) => ipcRenderer.send('widget:resize', { height }),
  quit: () => ipcRenderer.send('widget:quit'),
  // 深色 / 浅色主题：通知主进程同步窗口底色与原生主题
  setTheme: (theme) => ipcRenderer.send('widget:set-theme', { theme }),
  toggleOnTop: () => ipcRenderer.send('widget:toggle-top'),
  pinTaskbar: () => ipcRenderer.send('widget:pin-taskbar'),
  toggleLogin: () => ipcRenderer.send('widget:toggle-login'),
  // 发送窗口到副屏（第一个外接屏幕）
  sendToSecondScreen: () => ipcRenderer.send('widget:send-screen'),
  // 全屏：'normal' 普通全屏（任务栏可见）/ 'cover' 隐藏任务栏全屏 / null 退出全屏
  fullscreen: (mode) => ipcRenderer.send('widget:fullscreen', { mode }),
  // 主进程全屏状态变化（用于同步菜单勾选）
  onFullscreenState: (cb) => ipcRenderer.on('widget:fullscreen-state', (_e, mode) => cb(mode)),
  // 把渲染层栅格化好的菜单图标（PNG dataURL）交给主进程做托盘菜单图标
  setMenuIcons: (icons) => ipcRenderer.send('widget:menu-icons', icons),
  // 窗口模式 / 小组件模式切换；主进程应用后回播 'widget:window-mode'
  toggleWindowMode: () => ipcRenderer.send('widget:toggle-window-mode'),
  onWindowMode: (cb) => ipcRenderer.on('widget:window-mode', (_e, mode) => cb(mode)),
  // 上报房间显示偏好供托盘菜单同步；托盘点击切换时主进程回传 'group' | 'name'
  reportRoomState: (state) => ipcRenderer.send('widget:room-state', state),
  onToggleRoom: (cb) => ipcRenderer.on('widget:toggle-room', (_e, which) => cb(which)),
  // 托盘菜单点了「登录米家 / 选择家庭 / 隐藏的设备」：渲染层打开对应面板（'login'|'home'|'hidden'）
  onOpenPanel: (cb) => ipcRenderer.on('widget:open-panel', (_e, name) => cb(name)),
  // 托盘菜单点了「浅色/深色模式」：渲染层执行主题切换
  onToggleTheme: (cb) => ipcRenderer.on('widget:toggle-theme', () => cb()),
  // 标题栏右键：主进程拦截了 Windows 系统菜单，把鼠标屏幕坐标传回渲染层弹应用内菜单
  onTitlebarMenu: (cb) => ipcRenderer.on('widget:titlebar-menu', (_e, pt) => cb(pt)),
  // ---- 应用内弹出菜单（独立窗口，不受主窗口边界裁剪） ----
  // 主窗口渲染层：请求弹出 / 收起菜单，接收菜单项回传与「已收起」通知
  openMenu: (payload) => ipcRenderer.send('widget:open-menu', payload),
  closeMenu: () => ipcRenderer.send('widget:close-menu'),
  onMenuAction: (cb) => ipcRenderer.on('widget:menu-action', (_e, key) => cb(key)),
  onMenuClosed: (cb) => ipcRenderer.on('widget:menu-closed', () => cb()),
  // 弹出菜单窗口：接收菜单数据、回传内容尺寸、回传被点击项的 key
  onMenuData: (cb) => ipcRenderer.on('menu:data', (_e, data) => cb(data)),
  menuSize: (width, height, id) => ipcRenderer.send('menu:size', { width, height, id }),
  menuAction: (key, id) => ipcRenderer.send('menu:action', { key, id }),
  // 弹出菜单窗口：主进程已把窗口显示出来 → 开始单次入场淡入
  onMenuShown: (cb) => ipcRenderer.on('menu:shown', () => cb()),
  // ---- 独立弹窗（登录 / 关于，与主窗口脱钩、不受主窗口尺寸约束） ----
  // 主窗口渲染层：请求打开 / 关闭弹窗，接收弹窗开/关通知（用于控制黑色遮罩）
  openDialog: (kind) => ipcRenderer.send('widget:open-dialog', { kind }),
  closeDialog: () => ipcRenderer.send('widget:close-dialog'),
  onDialogOpen: (cb) => ipcRenderer.on('widget:dialog-open', (_e, kind) => cb(kind)),
  onDialogClosed: (cb) => ipcRenderer.on('widget:dialog-closed', () => cb()),
  // 独立弹窗窗口：接收渲染数据、回传卡片尺寸、请求关闭
  onDialogData: (cb) => ipcRenderer.on('dialog:data', (_e, data) => cb(data)),
  dialogSize: (width, height, id) => ipcRenderer.send('dialog:size', { width, height, id }),
  dialogClose: () => ipcRenderer.send('dialog:close'),
  // 独立弹窗窗口：主进程已把窗口显示出来 → 开始单次入场淡入
  onDialogShown: (cb) => ipcRenderer.on('dialog:shown', () => cb()),
  // 独立弹窗窗口：收起前清空内容回到透明态（趁窗口仍可见时真实绘制，避免复用旧帧造成闪烁）
  onDialogReset: (cb) => ipcRenderer.on('dialog:reset', () => cb()),
  // 关于窗口：打开外部链接（官网 / 作者主页）与检查更新
  openExternal: (url) => ipcRenderer.send('widget:open-external', url),
  checkUpdate: () => ipcRenderer.invoke('widget:check-update'),

  // ---- 登录 / 设备管理 ----
  loginStatus: () => ipcRenderer.invoke('widget:login-status'),
  loginPassword: (payload) => ipcRenderer.invoke('widget:login-password', payload),
  loginCaptcha: (payload) => ipcRenderer.invoke('widget:login-captcha', payload),
  loginRefreshCaptcha: (payload) => ipcRenderer.invoke('widget:login-refresh-captcha', payload),
  loginQR: () => ipcRenderer.invoke('widget:login-qr'),
  refreshDevices: () => ipcRenderer.invoke('widget:refresh-devices'),
  logout: () => ipcRenderer.invoke('widget:logout'),
  // ---- 家庭筛选 ----
  getHomes: () => ipcRenderer.invoke('widget:get-homes'),
  setHome: (homeId) => ipcRenderer.invoke('widget:set-home', { homeId }),
  // 二维码就绪（含 qrImageUrl / loginUrl），由渲染层负责展示
  onQR: (cb) => ipcRenderer.on('widget:qr', (_e, info) => cb(info)),
  // 登录状态变化（登录成功 / 登出 / 刷新）
  onLoginState: (cb) => ipcRenderer.on('widget:login-state', (_e, state) => cb(state)),
} satisfies IpcApi);

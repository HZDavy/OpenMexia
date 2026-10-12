'use strict';

const { contextBridge, ipcRenderer } = require('electron');

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
  pinTaskbarDone: () => ipcRenderer.send('widget:pin-taskbar-done'),
  toggleLogin: () => ipcRenderer.send('widget:toggle-login'),
  // 发送窗口到副屏（第一个外接屏幕）
  sendToSecondScreen: () => ipcRenderer.send('widget:send-screen'),
  // 全屏：'normal' 普通全屏（任务栏可见）/ 'cover' 隐藏任务栏全屏 / null 退出全屏
  fullscreen: (mode) => ipcRenderer.send('widget:fullscreen', { mode }),
  // 主进程全屏状态变化（用于同步菜单勾选）
  onFullscreenState: (cb) => ipcRenderer.on('widget:fullscreen-state', (_e, mode) => cb(mode)),
  // 把渲染层栅格化好的菜单图标（PNG dataURL）交给主进程做托盘菜单图标
  setMenuIcons: (icons) => ipcRenderer.send('widget:menu-icons', icons),
  // 托盘菜单点了「固定到任务栏」：主进程已让窗口临时出现在任务栏，通知渲染层弹引导
  onOpenPinGuide: (cb) => ipcRenderer.on('widget:open-pin-guide', () => cb()),
  // 托盘菜单点了「登录米家 / 选择家庭 / 隐藏的设备」：渲染层打开对应面板（'login'|'home'|'hidden'）
  onOpenPanel: (cb) => ipcRenderer.on('widget:open-panel', (_e, name) => cb(name)),
  // 托盘菜单点了「浅色/深色模式」：渲染层执行主题切换
  onToggleTheme: (cb) => ipcRenderer.on('widget:toggle-theme', () => cb()),
  // 标题栏右键：主进程拦截了 Windows 系统菜单，把鼠标屏幕坐标传回渲染层弹应用内菜单
  onTitlebarMenu: (cb) => ipcRenderer.on('widget:titlebar-menu', (_e, pt) => cb(pt)),
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
});

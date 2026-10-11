'use strict';

const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const { createProvider } = require('./src/devices');
const { MijiaLogin } = require('./src/mijia-login');
const QRCode = require('qrcode');

// 兜底：任何未捕获异常/未处理的 Promise 拒绝都只记录，不让主进程静默退出（避免“闪退”）
process.on('uncaughtException', (err) => {
  console.error('[main] uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[main] unhandledRejection:', reason);
});

// 初始尺寸；首次加载由渲染层测量内容后微调一次高度，之后窗口可自由缩放
const WIN_SIZE = { width: 364, height: 480 };
const EDGE_GAP = 20; // 默认位置距屏幕边缘的留白

let win = null;
let tray = null;
let provider = null;
let providerReady = Promise.resolve();   // 设备源首次构建完成信号（窗口先显示，数据后到）
let login = null;   // MijiaLogin：登录 / 设备清单 / 云端回退
let settings = { alwaysOnTop: true, launchAtLogin: false };
// 渲染层首次按内容自适应高度时置位，避免这段程序化 resize 被当作「用户调整的大小」持久化
let sizingProgrammatically = false;
// 托盘菜单图标：由渲染层把与应用内菜单同一套 SVG 栅格化成 PNG dataURL 后传回
let menuIcons = {};
// 全屏模式：null 未全屏；'normal' 铺满当前屏工作区（任务栏可见）；'cover' 铺满整屏并置顶（盖住任务栏）
let fsMode = null;
let fsSavedBounds = null;   // 进入全屏前的窗口矩形，退出全屏时还原

// 登录相关数据目录：userData/mijia（devices.json + cloud/auth.json）
const mijiaDataDir = () => path.join(app.getPath('userData'), 'mijia');

/* ---------------- 公共操作（托盘菜单与应用内菜单共用同一套逻辑） ---------------- */

function toggleOnTop() {
  settings = patchState({ alwaysOnTop: !settings.alwaysOnTop });
  if (win) {
    win.setAlwaysOnTop(settings.alwaysOnTop, 'floating');
    win.webContents.send('widget:settings', settings);
  }
}

function toggleLogin() {
  settings = patchState({ launchAtLogin: !settings.launchAtLogin });
  app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin, args: [] });
  if (win) win.webContents.send('widget:settings', settings);
}

// 发送到副屏（参考 PlanMonitor 的「→ 副屏」）：识别窗口当前所在显示器，
// 把它移到「列表中的下一块屏」（多屏时可在屏间循环切换），目标屏工作区内居中并防裁切。
function sendToSecondScreen() {
  if (!win) return;
  const displays = screen.getAllDisplays();
  const b = win.getBounds();
  // 先找出窗口当前所在的显示器（副屏坐标可能为负，必须用 getDisplayMatching 判定）
  const cur = screen.getDisplayMatching(b);
  let target;
  if (displays.length > 1) {
    const i = displays.findIndex((d) => d.id === cur.id);
    // 切到下一块屏；idx 未命中(i<0)时回到第一块
    target = displays[(i + 1) % displays.length] || displays[0];
  } else {
    target = displays[0];
  }
  const area = target.workArea;
  // 目标屏幕工作区内居中
  let x = Math.round(area.x + (area.width - b.width) / 2);
  let y = Math.round(area.y + (area.height - b.height) / 2);
  // 防裁切：窗口完全落在工作区内（DPR / 分辨率不同也安全）
  const maxX = area.x + area.width - b.width - EDGE_GAP;
  const maxY = area.y + area.height - b.height - EDGE_GAP;
  x = Math.min(Math.max(x, area.x + EDGE_GAP), Math.max(maxX, area.x + EDGE_GAP));
  y = Math.min(Math.max(y, area.y + EDGE_GAP), Math.max(maxY, area.y + EDGE_GAP));
  win.setPosition(x, y);
  patchState({ x, y });
  win.show();
  if (settings.alwaysOnTop) win.setAlwaysOnTop(true, 'floating');
}

// 全屏（两种，均调用 Windows 原生窗口状态，铺满无缝隙）：
//   'normal' → 原生「最大化」，铺满当前屏工作区、任务栏仍可见；
//   'cover'  → 原生「全屏」，覆盖整屏并盖住任务栏；
//   null     → 退出全屏，还原进入前的窗口矩形。
// 传入与当前相同的模式时视为「再次点击」→ 退出全屏。
function applyFullscreen(mode) {
  if (!win) return;
  mode = mode === 'cover' ? 'cover' : mode === 'normal' ? 'normal' : null;
  if (mode && fsMode === mode) mode = null;   // 再次点同一项 → 关掉

  if (mode && !fsMode) fsSavedBounds = win.getBounds();   // 首次进入全屏时记录还原矩形
  fsMode = mode;

  sizingProgrammatically = true;
  if (fsMode === 'cover') {
    // 隐藏任务栏：调用 Windows 原生全屏（整屏覆盖任务栏、无缝隙，支持全屏手势）
    if (win.isMaximized()) win.unmaximize();
    win.setFullScreen(true);
  } else if (fsMode === 'normal') {
    // 普通全屏：调用 Windows 原生最大化（铺满工作区、任务栏可见，支持 Win+↑ / 拖拽吸附）
    if (win.isFullScreen()) win.setFullScreen(false);
    win.maximize();
  } else {
    // 退出全屏：还原为普通窗口，并恢复进入前的位置与大小
    if (win.isFullScreen()) win.setFullScreen(false);
    if (win.isMaximized()) win.unmaximize();
    if (fsSavedBounds) { win.setBounds(fsSavedBounds); fsSavedBounds = null; }
    win.setAlwaysOnTop(!!settings.alwaysOnTop, 'floating');
  }
  if (fsMode && !win.isVisible()) win.show();
  setTimeout(() => { sizingProgrammatically = false; }, 400);
  broadcastFullscreenState();
}

// 把当前全屏状态同步给渲染层（应用内菜单勾选态）
function broadcastFullscreenState() {
  if (win && !win.isDestroyed()) win.webContents.send('widget:fullscreen-state', fsMode);
}

// 用户通过系统手势 / 快捷键改变窗口状态时，回写 fsMode 并同步菜单勾选。
// 程序化切换（applyFullscreen 内部）期间忽略这些事件，避免中途的 unmaximize/leave-full-screen 覆盖状态。
function syncFullscreenFromWindow() {
  if (!win || win.isDestroyed()) return;
  if (sizingProgrammatically) return;
  const next = win.isFullScreen() ? 'cover' : win.isMaximized() ? 'normal' : null;
  if (next !== fsMode) {
    fsMode = next;
    broadcastFullscreenState();
  }
}

// 固定到任务栏（引导流程，模仿 PlanMonitor 的 _toggle_pin）：
// 先临时取消 skipTaskbar 让窗口出现在任务栏，再让渲染层弹出引导对话框；
// 用户点「确定」后再恢复工具窗口模式（skipTaskbar:true）。
function startPinTaskbar() {
  if (!win) return;
  win.setSkipTaskbar(false);
  win.show();
  win.focus();
  win.webContents.send('widget:open-pin-guide');
}


/* ---------------- 状态持久化（窗口位置 / 偏好） ---------------- */

const stateFile = () => path.join(app.getPath('userData'), 'widget-state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
  } catch {
    return {};
  }
}

function patchState(patch) {
  const next = { ...loadState(), ...patch };
  try {
    fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
    fs.writeFileSync(stateFile(), JSON.stringify(next, null, 2));
  } catch {
    /* 忽略写入失败，不影响运行 */
  }
  return next;
}

/* ---------------- 窗口 ---------------- */

function defaultPosition() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { x: width - WIN_SIZE.width - EDGE_GAP, y: Math.round((height - WIN_SIZE.height) / 2) };
}

// 当前是否已持久化过「用户调整的窗口大小」（供渲染层决定是否跳过首次自适应）
function hasCustomSize() {
  const s = loadState();
  return Number.isFinite(s.width) && Number.isFinite(s.height) && s.width >= 300 && s.height >= 220;
}

function createWindow() {
  const state = loadState();
  const fallback = defaultPosition();
  const x = Number.isFinite(state.x) ? state.x : fallback.x;
  const y = Number.isFinite(state.y) ? state.y : fallback.y;
  // 记忆用户上次调整过的窗口大小；未调整过则用默认尺寸（首次由渲染层按内容自适应一次）
  const hasCustomSize = Number.isFinite(state.width) && Number.isFinite(state.height)
    && state.width >= 300 && state.height >= 220;
  const width = hasCustomSize ? state.width : WIN_SIZE.width;
  const height = hasCustomSize ? state.height : WIN_SIZE.height;

  settings = {
    alwaysOnTop: state.alwaysOnTop !== false,
    launchAtLogin: state.launchAtLogin === true,
  };

  win = new BrowserWindow({
    width,
    height,
    x,
    y,
    frame: false,
    // 非透明窗口：resize 热区与视觉边缘重合，垂直方向缩放不再失效；
    // 圆角与阴影交给 Windows DWM 原生处理，避免透明窗口的 margin 错位问题
    transparent: false,
    backgroundColor: '#171717',
    roundedCorners: true,
    resizable: true,
    minWidth: 300,
    minHeight: 220,
    // 交给 Windows 原生的最大化 / 全屏：铺满无缝隙，且支持系统手势与快捷键
    // （Win+↑ 最大化、拖拽到顶部吸附、Win+Shift+Enter 全屏等）
    maximizable: true,
    fullscreenable: true,
    // 工具窗口模式：默认不在任务栏显示（≈ PlanMonitor 的 Qt.Tool）
    skipTaskbar: true,
    hasShadow: true,
    show: false,
    alwaysOnTop: settings.alwaysOnTop,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  win.once('ready-to-show', () => {
    if (settings.alwaysOnTop) win.setAlwaysOnTop(true, 'floating');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.show();
  });

  win.on('moved', () => {
    if (sizingProgrammatically) return;   // 全屏/程序化移动不写入状态
    if (win.isMaximized() || win.isFullScreen()) return;   // 最大化/全屏的坐标不覆盖普通窗口位置
    const [wx, wy] = win.getPosition();
    patchState({ x: wx, y: wy });
  });

  // 记忆用户手动调整后的窗口大小（渲染层首次自适应高度产生的 resize 不计入）
  win.on('resize', () => {
    if (sizingProgrammatically) return;
    if (win.isMaximized() || win.isFullScreen()) return;   // 最大化/全屏的尺寸不覆盖普通窗口大小
    const [w, h] = win.getSize();
    patchState({ width: w, height: h });
  });

  // 用户用系统手势 / Win+↑ / Win+Shift+Enter 等改变窗口状态时，同步菜单勾选
  win.on('enter-full-screen', syncFullscreenFromWindow);
  win.on('leave-full-screen', syncFullscreenFromWindow);
  win.on('maximize', syncFullscreenFromWindow);
  win.on('unmaximize', syncFullscreenFromWindow);

  // 关闭按钮只收起到托盘，退出走托盘菜单
  win.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function toggleWindow() {
  if (!win) return;
  if (win.isVisible()) {
    win.hide();
  } else {
    win.show();
    if (settings.alwaysOnTop) win.setAlwaysOnTop(true, 'floating');
  }
}

/* ---------------- 设备数据源（登录后热重建） ---------------- */

function forwardDevices(devices) {
  if (win && !win.isDestroyed()) win.webContents.send('widget:devices', devices);
}

// 当前选定的家庭 id（持久化于 widget-state.json；空串 = 展示全部家庭）
function currentHomeId() {
  const v = loadState().currentHomeId;
  return v ? String(v) : '';
}

// 依据「是否存在已登录设备清单」重建 Provider：
//   有清单 → MiioProvider（局域网直连 + 云回退）；无 → MockProvider（演示数据）。
async function rebuildProvider() {
  if (provider) provider.stop();
  provider = await createProvider({ dataDir: mijiaDataDir(), login, homeId: currentHomeId() });
  provider.on('update', forwardDevices);
  provider.start();
  forwardDevices(provider.snapshot());
  return provider;
}

async function broadcastLoginState() {
  if (!login || !win || win.isDestroyed()) return;
  try {
    win.webContents.send('widget:login-state', await login.status());
  } catch { /* ignore */ }
}

/* ---------------- 托盘 ---------------- */

function buildTrayMenu() {
  const visible = win && win.isVisible();
  const icon = (key) => (menuIcons[key] ? { icon: menuIcons[key] } : {});
  return Menu.buildFromTemplate([
    {
      label: `窗口置顶${settings.alwaysOnTop ? ' ✓' : ''}`,
      ...icon('top'),
      click: toggleOnTop,
    },
    {
      label: '固定到任务栏',
      ...icon('pin'),
      click: startPinTaskbar,
    },
    {
      label: `开机自动启动${settings.launchAtLogin ? ' ✓' : ''}`,
      ...icon('login'),
      click: toggleLogin,
    },
    { type: 'separator' },
    {
      label: '发送到副屏',
      ...icon('reset'),
      click: sendToSecondScreen,
    },
    {
      label: `全屏${fsMode === 'normal' ? ' ✓' : ''}`,
      ...icon('fs'),
      click: () => applyFullscreen('normal'),
    },
    {
      label: `全屏（隐藏任务栏）${fsMode === 'cover' ? ' ✓' : ''}`,
      ...icon('fs-cover'),
      click: () => applyFullscreen('cover'),
    },
    {
      // 与应用内菜单「收起到托盘」对应，但托盘菜单里显示为「显示/隐藏小组件」更直观
      label: visible ? '隐藏小组件' : '显示小组件',
      ...icon('hide'),
      click: toggleWindow,
    },
    { type: 'separator' },
    {
      label: '退出',
      ...icon('quit'),
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png'));
  tray = new Tray(icon);
  tray.setToolTip('米家小组件');
  // 左键切换显示，右键弹菜单（Windows 上行为最可预期）
  tray.on('click', toggleWindow);
  tray.on('right-click', () => tray.popUpContextMenu(buildTrayMenu()));
}

/* ---------------- IPC ---------------- */

function registerIpc() {
  ipcMain.handle('widget:init', async () => {
    await providerReady;   // 等首次设备源构建完成（可能联网拉规格）
    return {
      devices: provider ? provider.snapshot() : [],
      settings,
      isMock: !provider || provider.source !== 'miio',
      login: await login.status(),
      currentHomeId: currentHomeId(),
      hasCustomSize: hasCustomSize(),
      fullscreen: fsMode,
    };
  });

  // ---- 登录 / 设备管理 ----
  ipcMain.handle('widget:login-status', async () => ({
    ...(await login.status()),
    isMock: provider ? provider.source !== 'miio' : true,
    currentHomeId: currentHomeId(),
  }));

  // 密码登录：小米账号 + 密码 → 抓取设备清单（含 token）后落盘
  ipcMain.handle('widget:login-password', async (_e, payload = {}) => {
    const res = await login.loginPassword(payload);
    await rebuildProvider();
    broadcastLoginState();
    return res;
  });

  // 二维码登录：主进程把二维码信息推给渲染层展示，登录完成后再拉设备清单
  ipcMain.handle('widget:login-qr', async () => {
    const res = await login.loginQR(async (info) => {
      if (!win || win.isDestroyed()) return;
      // 云端返回的 qrImageUrl 不保证能直接 <img>，这里用 loginUrl 本地生成 dataURL 兜底
      let dataUrl = '';
      try { if (info && info.loginUrl) dataUrl = await QRCode.toDataURL(info.loginUrl, { margin: 1, width: 220 }); } catch { /* keep empty */ }
      if (!win.isDestroyed()) win.webContents.send('widget:qr', { ...info, dataUrl });
    });
    await rebuildProvider();
    broadcastLoginState();
    return res;
  });

  ipcMain.handle('widget:refresh-devices', async () => {
    const devices = await login.refreshDevices();
    await rebuildProvider();
    broadcastLoginState();
    return { ok: true, count: devices.length };
  });

  ipcMain.handle('widget:logout', async () => {
    await login.logout();
    await rebuildProvider();
    broadcastLoginState();
    return { ok: true };
  });

  // ---- 家庭筛选 ----
  // 返回家庭清单 + 当前选定（homes 来自云端缓存 / 设备清单推导）
  ipcMain.handle('widget:get-homes', async () => ({
    homes: await login.getHomes(),
    currentHomeId: currentHomeId(),
  }));

  // 切换家庭：持久化后重建设备源，只展示该家庭下的设备（homeId 为空 = 全部）
  ipcMain.handle('widget:set-home', async (_e, { homeId } = {}) => {
    patchState({ currentHomeId: homeId ? String(homeId) : '' });
    await rebuildProvider();
    broadcastLoginState();
    return { ok: true, currentHomeId: currentHomeId() };
  });

  ipcMain.on('widget:set-power', (_e, { id, on }) => provider.setPower(id, on));
  ipcMain.on('widget:set-brightness', (_e, { id, value }) => provider.setBrightness(id, value));
  ipcMain.on('widget:set-color-temperature', (_e, { id, value }) => provider.setColorTemperature(id, value));
  ipcMain.on('widget:set-speed', (_e, { id, value }) => provider.setSpeed(id, value));
  // 通用字段写入：空调模式/温度/摆风、风扇双向摆风/自然风、净饮机制冰开关等
  ipcMain.on('widget:set-field', (_e, { id, field, value } = {}) => {
    if (typeof provider.setField === 'function') provider.setField(id, field, value);
  });
  // 动作调用：风扇手动上下左右等（siid/aiid）
  ipcMain.on('widget:call-action', (_e, { id, key } = {}) => {
    if (typeof provider.callAction === 'function') provider.callAction(id, key);
  });
  ipcMain.on('widget:hide', () => win && win.hide());
  // 渲染层首次加载后测量内容高度，微调一次窗口高度；之后由用户自由缩放
  ipcMain.on('widget:resize', (_e, { height } = {}) => {
    if (!win || !Number.isFinite(height)) return;
    const { height: maxH } = screen.getPrimaryDisplay().workAreaSize;
    const h = Math.min(Math.max(Math.round(height), 120), maxH);
    const [currentW, currentH] = win.getSize();
    if (currentH !== h) {
      sizingProgrammatically = true;
      win.setSize(currentW, h);
      setTimeout(() => { sizingProgrammatically = false; }, 400);
    }
  });
  ipcMain.on('widget:quit', () => {
    app.isQuitting = true;
    app.quit();
  });
  ipcMain.on('widget:toggle-top', () => toggleOnTop());
  ipcMain.on('widget:toggle-login', () => toggleLogin());
  ipcMain.on('widget:send-screen', () => sendToSecondScreen());
  // 全屏：'normal' 普通全屏（任务栏可见）/ 'cover' 隐藏任务栏全屏 / null 退出全屏
  ipcMain.on('widget:fullscreen', (_e, { mode } = {}) => applyFullscreen(mode || null));
  // 接收渲染层栅格化好的菜单图标：dataURL → nativeImage（缩放到 16×16，Windows 菜单标准尺寸），供托盘菜单使用
  ipcMain.on('widget:menu-icons', (_e, icons = {}) => {
    const next = {};
    for (const [key, dataUrl] of Object.entries(icons)) {
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
        const img = nativeImage.createFromDataURL(dataUrl);
        next[key] = img.isEmpty() ? img : img.resize({ width: 16, height: 16, quality: 'best' });
      }
    }
    menuIcons = next;
  });
  // 固定到任务栏（引导流程，模仿 PlanMonitor 的 _toggle_pin）：
  // 先临时取消 skipTaskbar 让窗口出现在任务栏，由渲染层弹出引导对话框；
  // 用户点「确定」后再恢复工具窗口模式（skipTaskbar:true）。
  ipcMain.on('widget:pin-taskbar', () => startPinTaskbar());
  ipcMain.on('widget:pin-taskbar-done', () => {
    if (!win) return;
    win.setSkipTaskbar(true);
    win.show();
    win.focus();
  });
}

/* ---------------- 启动 ---------------- */

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      win.show();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId('com.mijia.widget');
    // 深色主题：让 Chromium 的默认底色变为深色，避免缩放窗口时露出白色底
    nativeTheme.themeSource = 'dark';

    login = new MijiaLogin(mijiaDataDir());
    registerIpc();
    // 先建窗口/托盘让界面立即出现；设备源（可能联网拉规格）在后台构建，避免窗口延迟
    providerReady = rebuildProvider().catch((err) => {
      console.error('[main] rebuildProvider failed:', err);
    });
    createWindow();
    createTray();
  });

  app.on('window-all-closed', (e) => {
    // 托盘常驻，不随窗口关闭退出
    e.preventDefault();
  });

  app.on('before-quit', () => {
    app.isQuitting = true;
    if (provider) provider.stop();
  });
}

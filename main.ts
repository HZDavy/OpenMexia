import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen, nativeTheme, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as https from 'https';
import { createProvider } from './src/devices';
import { MijiaLogin } from './src/mijia-login';
import * as QRCode from 'qrcode';
import type { FullscreenMode, Settings, Theme, WindowMode } from './shared/types';
import type { MenuPlace, OpenMenuPayload, PopupMenuData, DialogKind, DialogData } from './shared/ipc';

// Electron 未内置「退出标记」这个应用私有属性，这里给 App 补上类型
declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}

// 兜底：任何未捕获异常/未处理的 Promise 拒绝都只记录，不让主进程静默退出（避免“闪退”）
process.on('uncaughtException', (err) => {
  console.error('[main] uncaughtException:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[main] unhandledRejection:', reason);
});

// Windows 上 Chromium 的「原生窗口遮挡计算」会把盖在主窗口之上的置顶弹出窗口（菜单 / 登录 / 关于）
// 误判为「被遮挡」，从而暂停/延迟它们的绘制：表现为弹出时先空一帧再出内容（闪一下）。
// 关掉该特性后，这些弹窗始终即时绘制，消除弹出闪烁。必须在 app ready 之前设置。
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

// 初始尺寸；首次加载由渲染层测量内容后微调一次高度，之后窗口可自由缩放
// 高度取 640：足够完整显示登录弹窗，避免首次打开时内容被截断
const WIN_SIZE = { width: 364, height: 640 };
const EDGE_GAP = 20; // 窗口贴边留白（拖拽/移动时的边界钳制）

let win: BrowserWindow;
let tray: Tray | null = null;
let provider: Awaited<ReturnType<typeof createProvider>>;
let providerReady: Promise<unknown> = Promise.resolve();   // 设备源首次构建完成信号（窗口先显示，数据后到）
let login: MijiaLogin;   // MijiaLogin：登录 / 设备清单 / 云端回退
let settings: Settings = { alwaysOnTop: true, launchAtLogin: false };
// 渲染层首次按内容自适应高度时置位，避免这段程序化 resize 被当作「用户调整的大小」持久化
let sizingProgrammatically = false;
// 托盘菜单图标：由渲染层把与应用内菜单同一套 SVG 栅格化成 PNG dataURL 后传回
let menuIcons: Record<string, Electron.NativeImage> = {};
// 渲染层的房间显示偏好（groupByRoom / showRoomName），由渲染层上报，供托盘菜单同步勾选与文案
let roomState = { groupByRoom: false, showRoomName: true };
// 全屏模式：null 未全屏；'normal' 铺满当前屏工作区（任务栏可见）；'cover' 铺满整屏并置顶（盖住任务栏）
let fsMode: FullscreenMode = null;
let fsSavedBounds: Electron.Rectangle | null = null;   // 进入全屏前的窗口矩形，退出全屏时还原

// 登录相关数据目录：userData/mijia（devices.json + cloud/auth.json）
const mijiaDataDir = (): string => path.join(app.getPath('userData'), 'mijia');

/* ---------------- 公共操作（托盘菜单与应用内菜单共用同一套逻辑） ---------------- */

function toggleOnTop() {
  settings = patchState({ alwaysOnTop: !settings.alwaysOnTop });
  if (win) {
    // 弹窗打开期间主窗口被临时取消置顶（见 openDialogWindow），此刻不能改回置顶——
    // 否则会重新引发「点遮罩闪一下」。待弹窗收起时由 closeDialogWindow 按最新设置统一恢复。
    if (dialogKind === null) win.setAlwaysOnTop(settings.alwaysOnTop, 'floating');
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
  let target: Electron.Display;
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
function applyFullscreen(mode: FullscreenMode) {
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
  const next: FullscreenMode = win.isFullScreen() ? 'cover' : win.isMaximized() ? 'normal' : null;
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

// 托盘菜单里「登录米家 / 选择家庭 / 隐藏的设备 / 关于」：唤起窗口并让渲染层打开对应面板
function openPanel(name: string) {
  if (!win || win.isDestroyed()) return;
  if (!win.isVisible()) win.show();
  win.focus();
  win.webContents.send('widget:open-panel', name);
}

// 主题切换交给渲染层执行（它负责切换 <html class>、记住 localStorage 并回传主进程持久化）
function toggleTheme() {
  if (win && !win.isDestroyed()) win.webContents.send('widget:toggle-theme');
}

// 检查更新：查询 GitHub Releases 最新版本，与当前版本比较（关于窗口按钮使用）
const RELEASES_API = 'https://api.github.com/repos/HZDavy/OpenMexia/releases/latest';
const RELEASES_PAGE = 'https://github.com/HZDavy/OpenMexia/releases';

function fetchJson(url: string, timeout = 8000): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'OpenMexia', Accept: 'application/vnd.github+json' },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const sc = res.statusCode ?? 0;
        if (sc >= 200 && sc < 300) {
          try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
        } else {
          reject(new Error(`HTTP ${sc}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => req.destroy(new Error('请求超时')));
  });
}

// 语义化版本比较：a > b 返回 1，相等返回 0，a < b 返回 -1
function compareVersion(a: string | number, b: string | number): number {
  const pa = String(a).replace(/^v/i, '').split(/[.+-]/).map((n) => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/i, '').split(/[.+-]/).map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

async function checkUpdate(): Promise<{
  ok: boolean;
  current: string;
  latest: string;
  hasUpdate: boolean;
  url: string;
  error?: string;
}> {
  const current = app.getVersion();
  try {
    const rel = await fetchJson(RELEASES_API);
    const latest = String(rel.tag_name || rel.name || '').replace(/^v/i, '');
    if (!latest) return { ok: true, current, latest: '', hasUpdate: false, url: RELEASES_PAGE };
    return {
      ok: true,
      current,
      latest,
      hasUpdate: compareVersion(latest, current) > 0,
      url: rel.html_url || RELEASES_PAGE,
    };
  } catch (e: any) {
    return {
      ok: false,
      current,
      latest: '',
      hasUpdate: false,
      url: RELEASES_PAGE,
      error: e && e.message ? e.message : String(e),
    };
  }
}


/* ---------------- 状态持久化（窗口位置 / 偏好） ---------------- */

const stateFile = (): string => path.join(app.getPath('userData'), 'widget-state.json');

function loadState(): any {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), 'utf8'));
  } catch {
    return {};
  }
}

function patchState(patch: Record<string, any>): any {
  const next = { ...loadState(), ...patch };
  try {
    fs.mkdirSync(path.dirname(stateFile()), { recursive: true });
    fs.writeFileSync(stateFile(), JSON.stringify(next, null, 2));
  } catch {
    /* 忽略写入失败，不影响运行 */
  }
  return next;
}

// 主题持久化：首次打开（无记录）默认深色，之后记住用户上次的选择
function stateTheme(state: any = loadState()): Theme {
  return state.theme === 'light' ? 'light' : 'dark';
}

// 窗口模式：'window' 正常窗口（任务栏可见、无托盘）；'widget' 小组件（工具窗口 + 托盘）。
// 首次打开（无记录）默认窗口模式，之后记住用户选择
function windowMode(state: any = loadState()): WindowMode {
  return state.windowMode === 'widget' ? 'widget' : 'window';
}

// 应用窗口模式：任务栏可见性 + 托盘显隐随模式切换，并广播给渲染层更新菜单
function applyWindowMode(mode: WindowMode) {
  const widget = mode === 'widget';
  patchState({ windowMode: mode });
  if (widget) {
    if (!tray) createTray();
    if (win && !win.isDestroyed()) win.setSkipTaskbar(true);
  } else {
    if (tray) { tray.destroy(); tray = null; }
    if (win && !win.isDestroyed()) {
      win.setSkipTaskbar(false);
      // 若窗口正处于「收起到托盘」的隐藏态，切到无托盘的窗口模式会再也唤不回 → 直接显示
      if (!win.isVisible()) win.show();
      win.focus();
    }
  }
  if (win && !win.isDestroyed()) win.webContents.send('widget:window-mode', mode);
}

function toggleWindowMode() {
  applyWindowMode(windowMode() === 'widget' ? 'window' : 'widget');
}

/* ---------------- 应用内弹出菜单（独立透明窗口，不受主窗口边界裁剪） ---------------- */

// 菜单内容四周留出的透明边距（须与 renderer/menu.html 里的 --mpad 一致）：
// 弹出窗口尺寸 = 菜单内容尺寸 + 2×MENU_PAD，菜单内容固定在窗口左上角 (MENU_PAD, MENU_PAD)。
// 之所以要留透明边距：菜单带圆角与阴影，若窗口与内容严丝合缝，圆角外的阴影会被窗口边缘切掉，
// 表现为菜单外圈出现一道「矩形硬边」。透明窗口无法把阴影画到窗口之外，所以留白必须
// ≥ 阴影的最大外扩量 = blur + |y 偏移|（见 menu.html 的 box-shadow：28 + 12 = 40），
// 再留约 16px 余量：实测高斯拖尾会略微超出 blur 值，余量太小仍会在窗口边缘看到细微硬边。
const MENU_PAD = 56;

// 弹出菜单窗口不复用：每次弹出都用「一个全新的、已预热好的窗口」，收起即销毁。
// 为什么不用复用：隐藏的 Electron 窗口不会重绘，会保留上一帧合成结果；复用窗口时
// 要么在「收起时先清空再隐藏」把清空过程画在可见窗口上（收起瞬间闪），
// 要么在「重新显示时」闪出上一次的内容。反复开合时这两种时序都会偶发漏一帧 → 非常精微的闪。
// 改为不复用后，任何窗口都只被 show() 一次、且首次显示前内容尚未上屏，从根上杜绝残帧。
// 为抵消「每次新建窗口」的加载延迟，常备一个隐藏的「备用窗口」预热好，弹出时直接取用。
let menuWin: BrowserWindow | null = null;       // 当前正在使用的菜单窗口（收起即销毁）
let menuSpare: BrowserWindow | null = null;     // 预热的备用窗口（隐藏、已加载完成）
let menuSpareReady = false;                     // 备用窗口是否已加载完成（可直接接收 menu:data）
let menuSeq = 0;                                // 每次弹出递增的会话 id，用于丢弃过期消息
let menuPending: PopupMenuData | null = null;   // 当前窗口尚未就绪时暂存的菜单数据
let menuAnchor: { x: number; y: number; place: MenuPlace } | null = null;   // 本次弹出的锚点
let menuShownAt = 0;                            // 窗口真正显示的时刻（配合菜单窗口 blur 去抖）

// 新建一个菜单窗口（无边框、透明、置顶、可获得焦点 focusable:true）。
// 可获焦是关键——「点击任意位置收起」依赖菜单窗口自身的 blur 事件：
// 用户点主窗口 / 其它应用 / 桌面时焦点离开菜单窗口 → blur → 收起，稳定可靠。
function buildMenuWindow(): BrowserWindow {
  const w = new BrowserWindow({
    width: 10,
    height: 10,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: true,
    hasShadow: false,
    roundedCorners: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // 菜单窗口在「隐藏态」完成内容注入与测量，显示后立即绘制；
      // 关闭后台节流，避免渲染被推迟导致显示瞬间先空一帧再出内容（闪一下）。
      backgroundThrottling: false,
    },
  });
  w.setAlwaysOnTop(true, 'screen-saver');
  w.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // 失焦即收起：只对「当前正在使用的窗口」生效（备用 / 已废弃窗口的失焦一律忽略）。
  // 「刚显示瞬间」的焦点抖动（show/focus 与窗口真正进入前台的时间差）用 menuShownAt 去抖忽略。
  w.on('blur', () => {
    if (w !== menuWin || w.isDestroyed()) return;
    if (Date.now() - menuShownAt < 150) return;
    if (menuAnchor === null) return;             // 已收起，忽略
    closeMenuWindow(true, 'menu-blur');
  });
  w.loadFile(path.join(__dirname, 'renderer', 'menu.html'));
  return w;
}

// 页面加载完成后回调（若已加载完则立即执行）。did-finish-load 是可靠的「可接收 IPC」信号。
function onceMenuReady(w: BrowserWindow, cb: () => void) {
  if (w.isDestroyed()) return;
  if (!w.webContents.isLoading()) cb();
  else w.webContents.once('did-finish-load', () => { if (!w.isDestroyed()) cb(); });
}

// 预热一个隐藏的备用窗口，供下一次弹出直接取用（避免弹出时现建窗口导致延迟/首帧空白）。
function prepareMenuSpare() {
  if (menuSpare && !menuSpare.isDestroyed()) return;
  const w = buildMenuWindow();
  menuSpare = w;
  menuSpareReady = false;
  onceMenuReady(w, () => { if (menuSpare === w) menuSpareReady = true; });
  w.on('closed', () => { if (menuSpare === w) { menuSpare = null; menuSpareReady = false; } });
}

// 渲染层请求弹出菜单：取一个「全新」窗口（优先用预热好的备用窗口），把菜单 HTML 交给它，
// 等它量好内容尺寸回传 menu:size 后再定位显示（两阶段，保证定位准确）。
function openMenuWindow(payload: OpenMenuPayload) {
  const data: PopupMenuData = { ...payload, id: ++menuSeq };
  menuAnchor = { x: Math.round(payload.anchor.x), y: Math.round(payload.anchor.y), place: payload.place };
  // 取用备用窗口；备用尚未就绪（极少见的连续快开）时退化为现建，数据挂到 menuPending。
  let w: BrowserWindow;
  let ready: boolean;
  if (menuSpare && !menuSpare.isDestroyed()) {
    w = menuSpare;
    ready = menuSpareReady;
    menuSpare = null;
    menuSpareReady = false;
  } else {
    w = buildMenuWindow();
    ready = false;
  }
  menuWin = w;
  w.hide();
  if (ready) {
    w.webContents.send('menu:data', data);
  } else {
    menuPending = data;
    onceMenuReady(w, () => {
      if (w !== menuWin || !menuPending) return;   // 期间窗口已被换掉 / 数据已被消费
      w.webContents.send('menu:data', menuPending);
      menuPending = null;
    });
  }
  // 立刻为「下一次」弹出预热新备用窗口，让下次弹出零等待。
  prepareMenuSpare();
}

// 弹出窗口量好内容尺寸后回调：按锚点计算位置，仅按「鼠标所在显示器」的工作区钳制
// （不参考主窗口边界，所以菜单可以伸出主窗口甚至整屏之外由工作区兜底）。
function placeMenuWindow(id: number, cw: number, ch: number) {
  if (!menuWin || menuWin.isDestroyed() || !menuAnchor) return;
  if (id !== menuSeq) return;                   // 过期会话丢弃
  const cww = Math.max(1, Math.round(cw));
  const chh = Math.max(1, Math.round(ch));
  const w = cww + MENU_PAD * 2;
  const h = chh + MENU_PAD * 2;
  // 菜单内容左上角的目标屏幕坐标
  const cx = menuAnchor.place === 'below-right' ? menuAnchor.x - cww : menuAnchor.x;
  const cy = menuAnchor.y;
  const area = screen.getDisplayNearestPoint({ x: menuAnchor.x, y: menuAnchor.y }).workArea;
  const x = Math.min(Math.max(cx - MENU_PAD, area.x), area.x + area.width - w);
  const y = Math.min(Math.max(cy - MENU_PAD, area.y), area.y + area.height - h);
  // 尺寸 + 位置一次性设定（原子操作）：分两步 setSize / setPosition 会产生
  // 「先按新尺寸、旧位置」或「旧尺寸、新位置」的中间帧，菜单出现瞬间会轻微跳一下（微小抖动）。
  menuWin.setBounds({ x: Math.round(x), y: Math.round(y), width: w, height: h });
  // Windows 上 setAlwaysOnTop 各档位都等价于 HWND_TOPMOST，真正的 z 序由「创建/激活顺序」决定。
  // 主窗口若也是置顶，可能比菜单窗口更晚进入 TOPMOST 组而压住菜单，需显式抬到 TOPMOST 组最前。
  // 关键：抬升必须在「显示之前」完成——显示后再 moveTop 会触发一次合成重排，
  // 直观表现为菜单/弹窗出现瞬间的微小抖动；而 show() 本身也会把窗口激活到最前，z 序不受影响。
  menuWin.moveTop();
  // 可获焦显示：菜单窗口拿到焦点后，用户点击主窗口 / 其它应用 / 桌面 → 菜单窗口失焦 → 自动收起，
  // 从底层保证「点击任意位置收起菜单」（不再依赖主窗口渲染层是否收到 pointerdown）。
  // 注意：show() 本身就会激活/聚焦窗口，无需再单独 focus()——多一次 focus 会让窗口在已经显示后
  // 再被激活一次，触发合成重排，表现为菜单出现瞬间的微小抖动。
  menuWin.show();
  menuShownAt = Date.now();
  // 窗口已真正显示出来（位置/尺寸就绪）→ 通知菜单页开始单次入场淡入，
  // 避免把动画放在 DOM 替换时触发（那时窗口还没显示，会出现「弹-缩-弹」的重放闪烁）。
  menuWin.webContents.send('menu:shown', { id });
}

// 收起弹出菜单窗口（幂等）；notify=true 且菜单「确实处于展开态」时，通知主窗口渲染层同步收起态。
// 关键：只有真的展开过才通知。空调用（菜单本就收起）若也发 widget:menu-closed，会把渲染层的
// menuOpen 误置为 false 造成状态失步——失步后「点击任意位置收起」会因为渲染层以为已收起而失效。
function closeMenuWindow(notify = true, reason = '?') {
  const wasOpen = menuAnchor !== null;
  // 收起前菜单窗口是否还持有焦点：点菜单项 / 按 Esc 属于「焦点仍在菜单上」，收起后需把焦点还给主窗口；
  // 而因失焦收起（menu-blur）时焦点已在别处，不能再抢回来。必须在销毁前取。
  const hadFocus = !!(menuWin && !menuWin.isDestroyed() && menuWin.isVisible() && menuWin.isFocused());
  menuAnchor = null;
  menuPending = null;
  const w = menuWin;
  // 先断开 menuWin 引用再销毁：销毁会触发窗口的 blur/closed 事件，此时菜单已不属于「当前窗口」，
  // 事件处理器会因 w !== menuWin 而直接忽略，避免重入收起。
  menuWin = null;
  // 不复用：直接销毁当前窗口。相比「先清空再隐藏」，销毁不产生任何可见的过渡帧
  // （透明窗口上清空/淡出的每一帧都是一次合成重排，反复开合时偶发漏帧就会看到精微的一闪）。
  if (w && !w.isDestroyed()) w.destroy();
  if (hadFocus && reason !== 'menu-blur' && win && !win.isDestroyed()) win.focus();
  if (notify && wasOpen && win && !win.isDestroyed()) win.webContents.send('widget:menu-closed');
  // 保持常备一个预热好的备用窗口，供下一次弹出零等待取用。
  prepareMenuSpare();
}

/* ---------------- 独立弹窗（登录 / 关于，与主窗口脱钩、不受主窗口尺寸约束） ---------------- */

// 弹窗窗口四周留白（须与 renderer/dialog.html 的 --dpad 一致），作用同 MENU_PAD：给圆角与投影让位。
// 卡片阴影 0 14px 30px 外扩 30+14=44，留 56 可再余 12px，避免高斯拖尾触到窗口边缘。
const DIALOG_PAD = 56;

let dialogWin: BrowserWindow | null = null;
let dialogWinReady = false;
let dialogSeq = 0;
let dialogPending: DialogData | null = null;
let dialogKind: DialogKind | null = null;                        // 当前弹窗种类（null = 未打开）
let dialogBounds = { width: 0, height: 0 };                      // 最近一次弹窗窗口尺寸（主窗口移动时重新居中用）
let dialogUserMoved = false;                                     // 用户是否手动拖动过弹窗（拖动后不再自动回中）

// 懒创建弹窗窗口：透明无边框、置顶、可聚焦（登录表单需要键盘输入），且可拖动（movable:true）。
// 与菜单窗口最大的区别是 focusable:true —— 因此弹窗获得焦点时主窗口会 blur（只收起菜单，不影响弹窗）。
function ensureDialogWin(): BrowserWindow {
  if (dialogWin && !dialogWin.isDestroyed()) return dialogWin;
  dialogWin = new BrowserWindow({
    width: 360,
    height: 460,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: true,
    hasShadow: false,
    roundedCorners: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // 同菜单窗口：隐藏态完成注入与测量，关闭后台节流让显示后立即绘制，避免闪一下。
      backgroundThrottling: false,
    },
  });
  dialogWin.setAlwaysOnTop(true, 'screen-saver');
  dialogWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // 用户拖动弹窗（渲染层 .pin-card 的 -webkit-app-region: drag 区域）→ 标记为「已手动移动」，
  // 之后主窗口移动 / 卡片尺寸变化都只保持用户摆放的位置，不再自动回中。
  dialogWin.on('moved', () => {
    if (!dialogWin || dialogWin.isDestroyed()) return;
    if (!dialogKind) return;                     // 未打开时的移动忽略
    dialogUserMoved = true;
  });
  dialogWinReady = false;
  dialogWin.webContents.on('did-finish-load', () => {
    dialogWinReady = true;
    if (dialogPending && dialogWin && !dialogWin.isDestroyed()) {
      dialogWin.webContents.send('dialog:data', dialogPending);
      dialogPending = null;
    }
  });
  dialogWin.on('closed', () => { dialogWin = null; dialogWinReady = false; dialogKind = null; });
  dialogWin.loadFile(path.join(__dirname, 'renderer', 'dialog.html'));
  return dialogWin;
}

// 打开弹窗：先隐藏（避免旧卡片闪现），把种类/主题/版本交给弹窗窗口渲染，
// 同时通知主窗口显示黑色遮罩。等弹窗量好卡片尺寸回传 dialog:size 后再定位显示。
function openDialogWindow(kind: DialogKind) {
  dialogKind = kind;
  dialogUserMoved = false;                        // 每次打开都从「居中」开始（用户本次拖动后再保持其位置）
  const data: DialogData = { id: ++dialogSeq, kind, theme: stateTheme(), version: app.getVersion() };
  const w = ensureDialogWin();
  w.hide();
  if (dialogWinReady) w.webContents.send('dialog:data', data);
  else dialogPending = data;
  // 弹窗打开期间关闭主窗口的后台节流：弹窗（focusable:true）一显示就会夺走主窗口焦点，
  // 主窗口随即被判定为「后台/被遮挡」，遮罩等绘制会被暂停，直到用户第一次点击主窗口
  // 重新获得焦点时才补绘制。这里仅在此期间关闭节流，弹窗收起后（见 closeDialogWindow）立即恢复。
  if (win && !win.isDestroyed()) {
    win.webContents.setBackgroundThrottling(false);
    // 根因修复：Windows 上主窗口('floating')与弹窗('screen-saver')都映射为 HWND_TOPMOST，
    // 同属置顶组，真正的 z 序由「激活顺序」决定 —— 用户点击主窗口内的黑色遮罩会把主窗口
    // 激活并抬到置顶组最前，其满屏遮罩会短暂盖住弹窗卡片，观感就是「点一下遮罩闪一下」。
    // 弹窗打开期间临时取消主窗口置顶：非置顶窗口在系统层面永远无法高于置顶弹窗，从根上排除
    // 这次 z 序翻转；弹窗收起后（见 closeDialogWindow）再按设置恢复。
    if (settings.alwaysOnTop) win.setAlwaysOnTop(false);
    win.webContents.send('widget:dialog-open', kind);
  }
}

// 弹窗量好卡片尺寸 → 以主窗口中心为中心定位，仅按显示器工作区钳制
function placeDialogWindow(id: number, cw: number, ch: number) {
  if (!dialogWin || dialogWin.isDestroyed()) return;
  if (id !== dialogSeq) return;                   // 过期会话丢弃
  const w = Math.max(1, Math.round(cw)) + DIALOG_PAD * 2;
  const h = Math.max(1, Math.round(ch)) + DIALOG_PAD * 2;
  // 已显示且尺寸未变 → 什么都不用做。避免紧随首次上报到来的第二次尺寸上报
  // 对「可见窗口」再 setSize/setPosition，导致淡入过程中窗口二次跳动（有时会看到闪一下）。
  if (dialogWin.isVisible() && w === dialogBounds.width && h === dialogBounds.height) return;
  dialogBounds = { width: w, height: h };
  // 首次打开（或以编程方式打开后尺寸变化）：以主窗口中心定位。
  // 用户手动拖动过之后：只保持其左上角随尺寸变化，不再自动回中（否则一改尺寸就跳回中心）。
  const wasVisible = dialogWin.isVisible();
  const keepUserPos = dialogUserMoved && wasVisible;
  const prev = keepUserPos ? dialogWin.getPosition() : null;
  // 尺寸 + 位置一次性设定（原子操作，避免分步 setSize / setPosition 的中间帧造成跳动）
  if (prev) {
    const area = screen.getDisplayNearestPoint({ x: prev[0], y: prev[1] }).workArea;
    const px = Math.min(Math.max(prev[0], area.x), area.x + area.width - w);
    const py = Math.min(Math.max(prev[1], area.y), area.y + area.height - h);
    dialogWin.setBounds({ x: px, y: py, width: w, height: h });
  } else {
    const { x, y } = centeredOnMain(w, h);
    dialogWin.setBounds({ x, y, width: w, height: h });
  }
  // 抬升放在「显示之前」：显示后再 moveTop 会触发合成重排，表现为弹窗出现瞬间的微小抖动；
  // show() 本身会把窗口激活到最前，z 序不受影响。（窗口底色已在创建时设为全透明）
  dialogWin.moveTop();                            // 确保盖在（可能置顶的）主窗口之上
  dialogWin.show();
  dialogWin.focus();
  // 窗口已真正显示出来 → 通知弹窗页开始单次入场淡入（同菜单窗口的处理）。
  if (!wasVisible) dialogWin.webContents.send('dialog:shown', { id });
}

// 主窗口中心为基准 + 工作区钳制的弹窗坐标
function centeredOnMain(w: number, h: number): { x: number; y: number } {
  const hasWin = win && !win.isDestroyed();
  const [wx, wy] = hasWin ? win.getPosition() : [0, 0];
  const [ww, wh] = hasWin ? win.getSize() : [0, 0];
  const area = screen.getDisplayMatching({ x: wx, y: wy, width: ww, height: wh }).workArea;
  const x = Math.min(Math.max(Math.round(wx + ww / 2 - w / 2), area.x), area.x + area.width - w);
  const y = Math.min(Math.max(Math.round(wy + wh / 2 - h / 2), area.y), area.y + area.height - h);
  return { x, y };
}

// 主窗口移动 / 缩放时，让弹窗重新居中（弹窗自身不随窗口变化尺寸）。
// 用户已手动拖动过 → 尊重用户摆放，不再自动回中。
function repositionDialogWindow() {
  if (!dialogWin || dialogWin.isDestroyed() || !dialogWin.isVisible() || !dialogBounds.width) return;
  if (dialogUserMoved) return;
  const { x, y } = centeredOnMain(dialogBounds.width, dialogBounds.height);
  dialogWin.setPosition(x, y);
}

// 收起弹窗（幂等）；notify=true 且确实开着时通知主窗口隐藏黑色遮罩
function closeDialogWindow(notify = true) {
  const wasOpen = dialogKind !== null;
  if (dialogWin && !dialogWin.isDestroyed() && dialogWin.isVisible()) {
    // 关键：先让弹窗清空内容、回到透明态，等这一帧真实画完后（窗口此刻仍可见）再隐藏。
    // 隐藏窗口不会重绘，会保留上一次「卡片可见」的画面；下次打开复用同一窗口时，
    // 首帧就是这张旧画面 → 表现为打开瞬间闪一下旧内容。趁可见时先画一张空帧即可根除。
    dialogWin.webContents.send('dialog:reset');
    setTimeout(() => {
      if (dialogKind !== null) return;            // 期间又被重新打开 → 不要隐藏
      if (dialogWin && !dialogWin.isDestroyed() && dialogWin.isVisible()) dialogWin.hide();
    }, 40);
  }
  dialogKind = null;
  // 恢复主窗口的默认后台节流与置顶（与 openDialogWindow 的临时改动配对）：
  // 仅当用户开启了置顶时才恢复置顶，否则保持「不置顶」原状。
  if (wasOpen && win && !win.isDestroyed()) {
    win.webContents.setBackgroundThrottling(true);
    if (settings.alwaysOnTop) win.setAlwaysOnTop(true, 'floating');
  }
  if (notify && wasOpen && win && !win.isDestroyed()) win.webContents.send('widget:dialog-closed');
}

/* ---------------- 窗口 ---------------- */

// 主屏工作区内居中的坐标（按窗口的实际宽高计算，避免记住的自定义尺寸下算出屏外坐标）
function centeredPosition(width: number, height: number): { x: number; y: number } {
  const { width: aw, height: ah } = screen.getPrimaryDisplay().workAreaSize;
  return {
    x: Math.round((aw - width) / 2),
    y: Math.round((ah - height) / 2),
  };
}

// 当前是否已持久化过「用户调整的窗口大小」（供渲染层决定是否跳过首次自适应）
function hasCustomSize(): boolean {
  const s = loadState();
  return Number.isFinite(s.width) && Number.isFinite(s.height) && s.width >= 300 && s.height >= 220;
}

function createWindow() {
  const state = loadState();
  // 记忆用户上次调整过的窗口大小；未调整过则用默认尺寸（首次由渲染层按内容自适应一次）
  const hasCustomSize = Number.isFinite(state.width) && Number.isFinite(state.height)
    && state.width >= 300 && state.height >= 220;
  const width = hasCustomSize ? state.width : WIN_SIZE.width;
  const height = hasCustomSize ? state.height : WIN_SIZE.height;
  // 首次打开（无记录坐标）默认在主屏居中
  const fallback = centeredPosition(width, height);
  let x = Number.isFinite(state.x) ? state.x : fallback.x;
  let y = Number.isFinite(state.y) ? state.y : fallback.y;
  // 记忆的坐标所在显示器可能已被拔掉/改了分辨率：窗口与最近屏工作区几乎不重叠时回退默认位置，防丢窗口
  const nearest = screen.getDisplayMatching({ x, y, width, height }).workArea;
  const overlapX = Math.min(x + width, nearest.x + nearest.width) - Math.max(x, nearest.x);
  const overlapY = Math.min(y + height, nearest.y + nearest.height) - Math.max(y, nearest.y);
  if (overlapX < 120 || overlapY < 60) { x = fallback.x; y = fallback.y; }

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
    backgroundColor: stateTheme(state) === 'light' ? '#f4f5f7' : '#171717',
    roundedCorners: true,
    resizable: true,
    minWidth: 300,
    minHeight: 220,
    // 交给 Windows 原生的最大化 / 全屏：铺满无缝隙，且支持系统手势与快捷键
    // （Win+↑ 最大化、拖拽到顶部吸附、Win+Shift+Enter 全屏等）
    maximizable: true,
    fullscreenable: true,
    // 小组件模式是工具窗口（≈ PlanMonitor 的 Qt.Tool），不在任务栏显示；
    // 窗口模式按正常窗口显示在任务栏
    skipTaskbar: windowMode(state) === 'widget',
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

  // 主窗口移动 / 缩放 / 隐藏 / 最小化 → 收起弹出菜单。
  // （弹出菜单锚定在屏幕坐标上，主窗口一旦变动就会与之脱节，直接收起最自然）
  win.on('move', () => { closeMenuWindow(true, 'main-move'); repositionDialogWindow(); });
  win.on('resize', () => { closeMenuWindow(true, 'main-resize'); repositionDialogWindow(); });
  win.on('hide', () => { closeMenuWindow(true, 'main-hide'); closeDialogWindow(true); });
  win.on('minimize', () => { closeMenuWindow(true, 'main-minimize'); closeDialogWindow(true); });
  // 注意：主窗口失焦不再负责收起菜单——菜单窗口现在是可获焦的（focusable:true），
  // 「点击任意位置收起」由菜单窗口自身的 blur 处理（见 buildMenuWindow）。
  // 若在这里也监听主窗口 blur，会与菜单「抢焦点」互相触发，反而造成抖动。
  // 主窗口与菜单窗口都是置顶(topmost)，z 序由「激活顺序」决定。
  win.on('focus', () => {
    if (Date.now() - menuShownAt <= 200) {
      // 菜单刚显示的一瞬间：主窗口若抢先获得前台、进入 TOPMOST 组把刚弹出的菜单压住，
      // 把菜单窗口抬到最前。仅当菜单「尚未显示」时才抬升——对已经可见的透明窗口做 moveTop
      // 会触发一次合成重排，观感就是菜单出现瞬间微闪；show() 本身已足够把它激活到最前。
      if (menuAnchor !== null && menuWin && !menuWin.isDestroyed() && !menuWin.isVisible()) menuWin.moveTop();
      return;
    }
    // 过了弹出瞬间后主窗口再获得焦点，只可能是「用户点了主窗口 / 桌面来收起菜单」。
    // 这里就立即收起，比等菜单窗口自身的 blur 更早一步：blur 到达时主窗口已经抢到前台，
    // 会短暂把菜单压住，观感就是收起瞬间抖一下；提前收起可避开这段重叠。
    if (menuAnchor !== null) closeMenuWindow(true, 'main-focus');
  });
  win.on('closed', () => {
    if (menuWin && !menuWin.isDestroyed()) menuWin.destroy();
    if (menuSpare && !menuSpare.isDestroyed()) menuSpare.destroy();
    if (dialogWin && !dialogWin.isDestroyed()) dialogWin.destroy();
  });

  // 标题栏右键：无边框窗口里 -webkit-app-region: drag 的区域被当作非客户区（标题栏），
  // 右键会触发本事件。preventDefault() 阻止 Windows 系统菜单，再把鼠标屏幕坐标交给渲染层，
  // 让应用内菜单跟随鼠标位置弹出（原生拖动 / 双击最大化等行为不受影响）。
  win.on('system-context-menu', (event) => {
    event.preventDefault();
    const pt = screen.getCursorScreenPoint();   // 屏幕坐标（DIP）
    win.webContents.send('widget:titlebar-menu', { x: pt.x, y: pt.y });
  });

  // 小组件模式：关闭按钮只收起到托盘，退出走托盘菜单；
  // 窗口模式：托盘不存在，关闭即退出（走默认关闭 → window-all-closed）
  win.on('close', (e) => {
    if (!app.isQuitting && windowMode() === 'widget') {
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

function forwardDevices(devices: any[]) {
  if (win && !win.isDestroyed()) win.webContents.send('widget:devices', devices);
}

// 当前选定的家庭 id（持久化于 widget-state.json；空串 = 展示全部家庭）
function currentHomeId(): string {
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
  if (!login) return;
  try {
    const st = await login.status();
    // isMock 与 createProvider 的选源逻辑保持一致：有设备清单才用真实源
    const payload = { ...st, isMock: !(st.hasDevices && st.deviceCount > 0) };
    if (win && !win.isDestroyed()) win.webContents.send('widget:login-state', payload);
    // 登录面板已迁到独立弹窗，登录态也要同步给弹窗窗口
    if (dialogWin && !dialogWin.isDestroyed()) dialogWin.webContents.send('widget:login-state', payload);
  } catch { /* ignore */ }
}

/* ---------------- 托盘 ---------------- */

function buildTrayMenu(): Electron.Menu {
  const visible = win && win.isVisible();
  const icon = (key: string) => (menuIcons[key] ? { icon: menuIcons[key] } : {});
  const light = stateTheme() === 'light';
  // 项与顺序与渲染层右上角菜单 (#menu) 保持一致，避免两处菜单内容不一致
  const template: Electron.MenuItemConstructorOptions[] = [
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
    {
      label: '登录米家 / 设备',
      ...icon('cloud'),
      click: () => openPanel('login'),
    },
    {
      label: '选择家庭',
      ...icon('home'),
      click: () => openPanel('home'),
    },
    {
      label: '隐藏的设备',
      ...icon('hidden'),
      click: () => openPanel('hidden'),
    },
    {
      // 状态在渲染层（localStorage），点击后发消息让它切换；勾选态由渲染层上报（roomState）
      label: `按房间分类显示${roomState.groupByRoom ? ' ✓' : ''}`,
      ...icon('room'),
      click: () => { if (win && !win.isDestroyed()) win.webContents.send('widget:toggle-room', 'group'); },
    },
    {
      label: roomState.showRoomName ? '隐藏房间名称' : '显示房间名称',
      ...icon('roomname'),
      click: () => { if (win && !win.isDestroyed()) win.webContents.send('widget:toggle-room', 'name'); },
    },
    { type: 'separator' },
    {
      label: light ? '深色模式' : '浅色模式',
      ...icon('theme'),
      click: toggleTheme,
    },
    {
      // 与应用内菜单一致：文案显示「将切换到的目标模式」
      label: windowMode() === 'widget' ? '窗口模式' : '小组件模式',
      ...icon('mode'),
      click: toggleWindowMode,
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
    {
      label: '关于',
      ...icon('about'),
      click: () => openPanel('about'),
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
  ];
  return Menu.buildFromTemplate(template);
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png'));
  const t = new Tray(icon);
  t.setToolTip('OpenMexia');
  // 左键切换显示，右键弹菜单（Windows 上行为最可预期）
  t.on('click', toggleWindow);
  t.on('right-click', () => t.popUpContextMenu(buildTrayMenu()));
  tray = t;
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
      theme: stateTheme(),
      windowMode: windowMode(),
      version: app.getVersion(),
    };
  });

  // ---- 登录 / 设备管理 ----
  ipcMain.handle('widget:login-status', async () => ({
    ...(await login.status()),
    isMock: provider ? provider.source !== 'miio' : true,
    currentHomeId: currentHomeId(),
  }));

  // 密码登录：小米账号 + 密码 → 抓取设备清单（含 token）后落盘
  // 小米风控可能要求图形验证码 / 二次安全验证，此时返回 needCaptcha / needCode，由渲染层继续输入
  ipcMain.handle('widget:login-password', async (_e, payload = {}) => {
    const res = await login.loginPassword(payload);
    if (res.needCaptcha || res.needCode) return res;
    // 先广播登录态（切换 演示/真实 模式），再推送设备，避免渲染层短暂闪出演示数据
    await broadcastLoginState();
    await rebuildProvider();
    return res;
  });

  // 密码登录续步：提交图形验证码 / 二次验证码
  ipcMain.handle('widget:login-captcha', async (_e, payload = {}) => {
    const res = await login.loginPasswordCaptcha(payload);
    if (res.needCaptcha || res.needCode) return res;   // 仍需要继续输入
    await broadcastLoginState();
    await rebuildProvider();
    return res;
  });

  // 刷新验证码图片（图形验证码 / 二次验证发送用的图形验证码）
  ipcMain.handle('widget:login-refresh-captcha', async (_e, payload = {}) => {
    const res = await login.refreshPwdCaptcha(payload);
    if (res.needCaptcha || res.needCode) return res;
    await broadcastLoginState();
    await rebuildProvider();
    return res;
  });

  // 二维码登录：主进程把二维码信息推给渲染层展示，登录完成后再拉设备清单
  ipcMain.handle('widget:login-qr', async () => {
    const res = await login.loginQR(async (info) => {
      // 云端返回的 qrImageUrl 不保证能直接 <img>，这里用 loginUrl 本地生成 dataURL 兜底
      let dataUrl = '';
      try { if (info && info.loginUrl) dataUrl = await QRCode.toDataURL(info.loginUrl, { margin: 1, width: 220 }); } catch { /* keep empty */ }
      const payload = { ...info, dataUrl };
      if (win && !win.isDestroyed()) win.webContents.send('widget:qr', payload);
      // 登录面板已迁到独立弹窗，二维码也要推给弹窗窗口
      if (dialogWin && !dialogWin.isDestroyed()) dialogWin.webContents.send('widget:qr', payload);
    });
    await broadcastLoginState();
    await rebuildProvider();
    return res;
  });

  ipcMain.handle('widget:refresh-devices', async () => {
    const devices = await login.refreshDevices();
    await broadcastLoginState();
    await rebuildProvider();
    return { ok: true, count: devices.length };
  });

  ipcMain.handle('widget:logout', async () => {
    await login.logout();
    broadcastLoginState();
    await rebuildProvider();
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
    await broadcastLoginState();
    await rebuildProvider();
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
    const h = Math.min(Math.max(Math.round(height), 320), maxH);
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
  // 深色 / 浅色主题：同步 Chromium 原生主题与窗口底色，避免浅色下缩放露出深色边
  ipcMain.on('widget:set-theme', (_e, { theme } = {}) => {
    const t: Theme = theme === 'light' ? 'light' : 'dark';
    patchState({ theme: t });   // 记住用户选择，下次启动沿用
    const light = t === 'light';
    nativeTheme.themeSource = light ? 'light' : 'dark';
    if (win && !win.isDestroyed()) win.setBackgroundColor(light ? '#f4f5f7' : '#171717');
  });
  // 接收渲染层栅格化好的菜单图标：dataURL → nativeImage（缩放到 16×16，Windows 菜单标准尺寸），供托盘菜单使用
  ipcMain.on('widget:menu-icons', (_e, icons = {}) => {
    const next: Record<string, Electron.NativeImage> = {};
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
  // 窗口模式 / 小组件模式切换（菜单与托盘共用）
  ipcMain.on('widget:toggle-window-mode', () => toggleWindowMode());
  // 渲染层上报房间显示偏好（groupByRoom / showRoomName），供托盘菜单同步勾选态与文案
  ipcMain.on('widget:room-state', (_e, s = {}) => {
    roomState = {
      groupByRoom: (s as any).groupByRoom === true,
      showRoomName: (s as any).showRoomName !== false,
    };
  });
  // ---- 应用内弹出菜单（独立窗口） ----
  // 渲染层请求弹出 / 收起
  ipcMain.on('widget:open-menu', (_e, payload: OpenMenuPayload = {} as any) => {
    if (payload && typeof payload.html === 'string' && payload.anchor) openMenuWindow(payload);
  });
  ipcMain.on('widget:close-menu', () => closeMenuWindow());
  // 弹出窗口量好内容尺寸 → 定位并显示
  ipcMain.on('menu:size', (_e, { width, height, id } = {} as any) => {
    if (Number.isFinite(width) && Number.isFinite(height)) placeMenuWindow(id, width, height);
  });
  // 弹出窗口里点了某项（key 非空）或点了透明留白（key 为空）→ 先收起，再把 key 转交主窗口渲染层执行
  ipcMain.on('menu:action', (_e, { key, id } = {} as any) => {
    if (id !== menuSeq) return;                 // 过期会话丢弃
    closeMenuWindow();
    if (key && win && !win.isDestroyed()) win.webContents.send('widget:menu-action', key);
  });
  // ---- 独立弹窗（登录 / 关于） ----
  // 主窗口渲染层请求打开 / 关闭
  ipcMain.on('widget:open-dialog', (_e, { kind } = {} as any) => {
    if (kind === 'login' || kind === 'about') openDialogWindow(kind);
  });
  ipcMain.on('widget:close-dialog', () => closeDialogWindow());
  // 弹窗量好卡片尺寸 → 定位并显示
  ipcMain.on('dialog:size', (_e, { width, height, id } = {} as any) => {
    if (Number.isFinite(width) && Number.isFinite(height)) placeDialogWindow(id, width, height);
  });
  // 弹窗自身请求关闭（关闭按钮 / Esc）→ 收起并通知主窗口隐藏遮罩
  ipcMain.on('dialog:close', () => closeDialogWindow());
  // 打开外部链接（关于窗口的官网 / 作者主页）：仅允许 http(s)，交给系统默认浏览器
  ipcMain.on('widget:open-external', (_e, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      shell.openExternal(url).catch(() => {});
    }
  });
  // 检查更新（关于窗口按钮）：返回 { ok, current, latest, hasUpdate, url }
  ipcMain.handle('widget:check-update', () => checkUpdate());
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
    // 主题：首次打开默认深色，之后沿用用户上次选择（避免浅色下启动瞬间露深色底）
    nativeTheme.themeSource = stateTheme();

    login = new MijiaLogin(mijiaDataDir());
    registerIpc();
    // 先建窗口/托盘让界面立即出现；设备源（可能联网拉规格）在后台构建，避免窗口延迟。
    // 启动时先静默刷新一次清单：确保恢复的密码会话下能补齐中文默认名与家庭归属（homeId），
    // 再据此重建 Provider。刷新失败（如离线）不阻断启动，退回本地清单。
    providerReady = (async () => {
      try {
        if (login.hasDevices() && await login.ensurePwdSession()) await login.refreshDevices();
      } catch (e: any) {
        console.error('[main] 启动刷新失败：', e && e.message);
      }
      return rebuildProvider();
    })().catch((err) => {
      console.error('[main] rebuildProvider failed:', err);
    });
    createWindow();
    prepareMenuSpare();   // 预热弹出菜单窗口，首次弹出即零等待
    // 托盘只在小组件模式存在；窗口模式无托盘、窗口常驻任务栏
    if (windowMode() === 'widget') createTray();
  });

  app.on('window-all-closed', () => {
    // 小组件模式：托盘常驻，不随窗口关闭退出；
    // 窗口模式：托盘不存在，窗口关闭即退出
    if (windowMode() !== 'widget') app.quit();
  });

  app.on('before-quit', () => {
    app.isQuitting = true;
    if (provider) provider.stop();
    if (menuWin && !menuWin.isDestroyed()) menuWin.destroy();
    if (menuSpare && !menuSpare.isDestroyed()) menuSpare.destroy();
  });
}

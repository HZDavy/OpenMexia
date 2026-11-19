/**
 * OpenMexia Web 版入口（浏览器访问，Node 侧负责米家登录与设备控制）。
 *
 * 与 Electron 桌面版共用同一套核心：src/mijia-login.ts（登录 / 设备清单）、
 * src/devices.ts（局域网直连 + 云端回退）。桌面版里由 IPC 承担的事情，这里改由
 * HTTP + SSE 承担：浏览器 → HTTP 接口下发控制指令，服务端 → SSE 推送设备快照、
 * 登录态与二维码。前端渲染层（renderer/）原样复用，浏览器桥接层见 renderer/web-bridge.ts。
 *
 * 默认只监听 127.0.0.1，避免把家里的米家凭据和控制能力暴露到局域网。
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import * as https from 'https';
import * as QRCode from 'qrcode';
import { createProvider } from './src/devices';
import { MijiaLogin } from './src/mijia-login';

const BUILD_DIR = __dirname;                                   // tsc 产物：build/
const pkg = JSON.parse(fs.readFileSync(path.join(BUILD_DIR, '..', 'package.json'), 'utf8'));
const APP_VERSION: string = String(pkg.version || '0.0.0');

/* ---------------- 配置 ---------------- */

const PORT = Number(process.env.PORT || process.env.OPENMEXIA_PORT || 8787);
const HOST = process.env.HOST || process.env.OPENMEXIA_HOST || '127.0.0.1';
const TOKEN = String(process.env.OPENMEXIA_WEB_TOKEN || '');

// 监听非本机地址时强制要求 token：这个端口能直接控制家里的设备
if (HOST !== '127.0.0.1' && HOST !== 'localhost' && HOST !== '::1' && !TOKEN) {
  console.error('[web] 监听非本机地址必须设置 OPENMEXIA_WEB_TOKEN，例如：');
  console.error('      $env:OPENMEXIA_WEB_TOKEN="your-secret"; $env:HOST="0.0.0.0"; node build/server.js');
  process.exit(1);
}

/** 应用数据目录：与 Electron 桌面版的 userData 目录保持一致（Windows 为 %APPDATA%\OpenMexia）。 */
function defaultDataRoot(): string {
  if (process.env.OPENMEXIA_DATA_DIR) return path.resolve(process.env.OPENMEXIA_DATA_DIR);
  const base = process.env.APPDATA
    || (process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : path.join(os.homedir(), '.config'));
  return path.join(base, 'OpenMexia');
}

const dataRoot = defaultDataRoot();
const mijiaDir = path.join(dataRoot, 'mijia');
const stateFile = path.join(dataRoot, 'web-state.json');

/* ---------------- 偏好持久化（主题 / 家庭） ---------------- */

function loadState(): any {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    return {};
  }
}

function patchState(patch: Record<string, any>): any {
  const next = { ...loadState(), ...patch };
  try {
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });
    fs.writeFileSync(stateFile, JSON.stringify(next, null, 2));
  } catch {
    /* 忽略写入失败，不影响运行 */
  }
  return next;
}

const stateTheme = (state: any = loadState()): string => (state.theme === 'light' ? 'light' : 'dark');
const currentHomeId = (): string => {
  const v = loadState().currentHomeId;
  return v ? String(v) : '';
};

// Web 版没有窗口，这几项窗口相关设置恒为关闭（渲染层只用它们画菜单勾选态）
const settings = { alwaysOnTop: false, launchAtLogin: false, launchInTray: false };

/* ---------------- SSE 推送 ---------------- */

const clients = new Set<http.ServerResponse>();

function sseSend(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    try { res.write(payload); } catch { clients.delete(res); }
  }
}

function sseOpen(req: http.IncomingMessage, res: http.ServerResponse) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');
  clients.add(res);
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* ignore */ }
  }, 25000);
  req.on('close', () => { clearInterval(ping); clients.delete(res); });
}

/* ---------------- 登录 / 设备源 ---------------- */

const login = new MijiaLogin(mijiaDir);
let provider: any = null;
let providerReady: Promise<unknown> = Promise.resolve();

async function rebuildProvider() {
  if (provider) provider.stop();
  provider = await createProvider({ dataDir: mijiaDir, login, homeId: currentHomeId() });
  provider.on('update', (devices: any[]) => sseSend('devices', devices));
  provider.start();
  sseSend('devices', provider.snapshot());
}

async function broadcastLoginState() {
  try {
    const st = await login.status();
    sseSend('login-state', { ...st, isMock: !(st.hasDevices && st.deviceCount > 0) });
  } catch { /* ignore */ }
}

async function boot() {
  providerReady = rebuildProvider().catch((e) => {
    console.error('[web] 初始化设备源失败：', e);
  });
  await providerReady;
}

/* ---------------- 版本检查 ---------------- */

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

function compareVersion(a: string | number, b: string | number): number {
  const pa = String(a).replace(/^v/i, '').split(/[.+-]/).map((n) => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/i, '').split(/[.+-]/).map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
}

async function checkUpdate() {
  const current = APP_VERSION;
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

/* ---------------- HTTP 工具 ---------------- */

function parseCookies(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function authorized(req: http.IncomingMessage, url: URL): boolean {
  if (!TOKEN) return true;
  if (url.searchParams.get('token') === TOKEN) return true;
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.openmexia_token === TOKEN) return true;
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ') && auth.slice(7) === TOKEN) return true;
  return false;
}

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) { req.destroy(); reject(new Error('请求体过大')); return; }
      body += chunk;
    });
    req.on('end', () => {
      if (!body) { resolve({}); return; }
      try { resolve(JSON.parse(body)); } catch { reject(new Error('请求体不是合法 JSON')); }
    });
    req.on('error', reject);
  });
}

function sendJson(res: http.ServerResponse, status: number, data: any) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse, pathname: string) {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '');
  const file = path.resolve(BUILD_DIR, rel);
  // 只允许访问 build/ 目录内的文件，挡住 ../ 穿越
  if (file !== BUILD_DIR && !file.startsWith(BUILD_DIR + path.sep)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); res.end('Not Found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': path.extname(file) === '.html' ? 'no-store' : 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  });
}

/* ---------------- API ---------------- */

async function handleApi(req: http.IncomingMessage, res: http.ServerResponse, url: URL) {
  const route = `${req.method} ${url.pathname}`;
  const body = req.method === 'POST' ? await readBody(req) : {};

  switch (route) {
    // ---- 启动快照 ----
    case 'GET /api/init': {
      await providerReady;
      sendJson(res, 200, {
        devices: provider ? provider.snapshot() : [],
        settings,
        isMock: !provider || provider.source !== 'miio',
        login: await login.status(),
        currentHomeId: currentHomeId(),
        hasCustomSize: true,       // Web 版没有窗口尺寸概念，跳过渲染层的自适应
        fullscreen: null,
        theme: stateTheme(),
        windowMode: 'window',      // 隐藏「固定到任务栏 / 收起到托盘」等桌面专属菜单项
        version: APP_VERSION,
      });
      return;
    }

    // ---- 登录 / 设备管理 ----
    case 'GET /api/login/status':
      sendJson(res, 200, {
        ...(await login.status()),
        isMock: !provider || provider.source !== 'miio',
        currentHomeId: currentHomeId(),
      });
      return;
    case 'POST /api/login/password': {
      const r = await login.loginPassword(body);
      if (!r.needCaptcha && !r.needCode) {
        await broadcastLoginState();
        await rebuildProvider();
      }
      sendJson(res, 200, r);
      return;
    }
    case 'POST /api/login/captcha': {
      const r = await login.loginPasswordCaptcha(body);
      if (!r.needCaptcha && !r.needCode) {
        await broadcastLoginState();
        await rebuildProvider();
      }
      sendJson(res, 200, r);
      return;
    }
    case 'POST /api/login/refresh-captcha': {
      const r = await login.refreshPwdCaptcha(body);
      if (!r.needCaptcha && !r.needCode) {
        await broadcastLoginState();
        await rebuildProvider();
      }
      sendJson(res, 200, r);
      return;
    }
    case 'POST /api/login/qr': {
      const r = await login.loginQR(async (info: any) => {
        let dataUrl = '';
        try {
          if (info && info.loginUrl) dataUrl = await QRCode.toDataURL(info.loginUrl, { margin: 1, width: 220 });
        } catch { /* 保留空图 */ }
        sseSend('qr', { ...info, dataUrl });
      });
      await broadcastLoginState();
      await rebuildProvider();
      sendJson(res, 200, r);
      return;
    }
    case 'POST /api/refresh-devices': {
      const devices = await login.refreshDevices();
      await broadcastLoginState();
      await rebuildProvider();
      sendJson(res, 200, { ok: true, count: devices.length });
      return;
    }
    case 'POST /api/logout': {
      await login.logout();
      await broadcastLoginState();
      await rebuildProvider();
      sendJson(res, 200, { ok: true });
      return;
    }

    // ---- 家庭筛选 ----
    case 'GET /api/homes':
      sendJson(res, 200, { homes: await login.getHomes(), currentHomeId: currentHomeId() });
      return;
    case 'POST /api/home': {
      patchState({ currentHomeId: body.homeId ? String(body.homeId) : '' });
      await broadcastLoginState();
      await rebuildProvider();
      sendJson(res, 200, { ok: true, currentHomeId: currentHomeId() });
      return;
    }

    // ---- 设备控制（与桌面版 IPC 一一对应，均为即发即忘） ----
    case 'POST /api/device/power':
      if (provider) provider.setPower(body.id, !!body.on);
      sendJson(res, 200, { ok: true });
      return;
    case 'POST /api/device/brightness':
      if (provider) provider.setBrightness(body.id, Number(body.value));
      sendJson(res, 200, { ok: true });
      return;
    case 'POST /api/device/color-temperature':
      if (provider) provider.setColorTemperature(body.id, Number(body.value));
      sendJson(res, 200, { ok: true });
      return;
    case 'POST /api/device/speed':
      if (provider) provider.setSpeed(body.id, Number(body.value));
      sendJson(res, 200, { ok: true });
      return;
    case 'POST /api/device/field':
      if (provider && typeof provider.setField === 'function') provider.setField(body.id, body.field, body.value);
      sendJson(res, 200, { ok: true });
      return;
    case 'POST /api/device/action':
      if (provider && typeof provider.callAction === 'function') provider.callAction(body.id, body.key);
      sendJson(res, 200, { ok: true });
      return;

    // ---- 偏好 ----
    case 'POST /api/theme':
      patchState({ theme: body.theme === 'light' ? 'light' : 'dark' });
      sendJson(res, 200, { ok: true });
      return;

    case 'GET /api/check-update':
      sendJson(res, 200, await checkUpdate());
      return;

    default:
      sendJson(res, 404, { error: '接口不存在' });
  }
}

/* ---------------- 服务器 ---------------- */

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (!authorized(req, url)) {
    res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Unauthorized：请使用带 token 的地址访问（?token=...）');
    return;
  }

  // 带 token 打开页面后写入 Cookie，之后前端接口与 SSE 都不必再拼 token
  if (TOKEN && url.searchParams.get('token') === TOKEN && !url.pathname.startsWith('/api/')) {
    res.setHeader('Set-Cookie', `openmexia_token=${encodeURIComponent(TOKEN)}; Path=/; HttpOnly; SameSite=Lax`);
  }

  if (url.pathname === '/api/events') { sseOpen(req, res); return; }

  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url).catch((e: any) => {
      console.error('[web] API 出错：', e);
      if (!res.headersSent) sendJson(res, 500, { error: e && e.message ? e.message : String(e) });
      else res.end();
    });
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405); res.end('Method Not Allowed'); return;
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(302, { Location: '/renderer/index.html' });
    res.end();
    return;
  }

  serveStatic(req, res, url.pathname);
});

process.on('uncaughtException', (err) => { console.error('[web] uncaughtException:', err); });
process.on('unhandledRejection', (reason) => { console.error('[web] unhandledRejection:', reason); });

boot().then(() => {
  server.listen(PORT, HOST, () => {
    const shown = HOST === '0.0.0.0' ? '<本机局域网 IP>' : HOST;
    const suffix = TOKEN ? `?token=${TOKEN}` : '';
    console.log(`[web] OpenMexia Web 已启动：http://${shown}:${PORT}/${suffix}`);
    console.log(`[web] 数据目录：${dataRoot}`);
  });
});

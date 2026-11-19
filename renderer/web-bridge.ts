/**
 * 浏览器桥接层：在 Web 版里把 Electron preload 暴露的 `window.mijia` 复刻出来。
 *
 * 桌面版里由主进程（main.ts）完成的事，这里改用 HTTP 接口 + SSE 事件：
 *   - 调用型接口（开关灯、登录、刷新设备…）→ fetch POST/GET
 *   - 推送型事件（设备快照、登录态、二维码）→ EventSource
 *   - 弹出菜单 / 登录弹窗 → 复用原有的 menu.html / dialog.html，放进透明 iframe，
 *     通过 postMessage 传递数据，避免和主窗口的点击 / 失焦逻辑互相打架
 *
 * 在 Electron 里 window.mijia 已由 preload 提供，本文件会直接跳过，不影响桌面版。
 */
(() => {
  if ((window as any).mijia) return;

  const page = location.pathname;
  const isMenuFrame = /menu\.html$/.test(page);
  const isDialogFrame = /dialog\.html$/.test(page);
  const isTop = window.parent === window;

  type Cb = (...args: any[]) => void;
  const handlers: Record<string, Cb[]> = {};

  const on = (name: string, cb: Cb) => {
    (handlers[name] || (handlers[name] = [])).push(cb);
  };
  const fire = (name: string, ...args: any[]) => {
    for (const cb of handlers[name] || []) {
      try { cb(...args); } catch (e) { console.error('[web]', name, e); }
    }
  };

  /* ---------------- HTTP ---------------- */

  async function call(pathname: string, body?: any): Promise<any> {
    const init: RequestInit = body === undefined
      ? { cache: 'no-store' }
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
    const res = await fetch(pathname, init);
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || `HTTP ${res.status}`);
    return data;
  }

  // 即发即忘的控制类接口：失败只记日志，不打断界面（与桌面版的 ipcRenderer.send 一致）
  const post = (pathname: string, body: any) => {
    call(pathname, body).catch((e) => console.error('[web]', pathname, e));
  };

  // init 只请求一次，后续（比如打开弹窗时要版本号）复用同一份结果
  let initPromise: Promise<any> | null = null;
  const getInit = () => {
    if (!initPromise) initPromise = call('/api/init');
    return initPromise;
  };

  /* ---------------- 事件流 ---------------- */

  function connectEvents() {
    const es = new EventSource('/api/events');
    es.addEventListener('devices', (e) => {
      try { fire('devices', JSON.parse((e as MessageEvent).data)); } catch { /* ignore */ }
    });
    es.addEventListener('settings', (e) => {
      try { fire('settings', JSON.parse((e as MessageEvent).data)); } catch { /* ignore */ }
    });
    es.addEventListener('login-state', (e) => {
      try { fire('login-state', JSON.parse((e as MessageEvent).data)); } catch { /* ignore */ }
    });
    es.addEventListener('qr', (e) => {
      try { fire('qr', JSON.parse((e as MessageEvent).data)); } catch { /* ignore */ }
    });
  }

  /* ---------------- 父子窗口消息 ---------------- */

  const postToParent = (data: any) => {
    if (window.parent !== window) window.parent.postMessage(data, location.origin);
  };

  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin) return;
    const d: any = e.data;
    if (!d || typeof d.type !== 'string') return;
    if (d.type === 'openmexia:dialog-data') {
      fire('dialog-data', d.data);
      document.body.classList.add('revealed');
    } else if (d.type === 'openmexia:dialog-shown') {
      fire('dialog-shown');
    }
  });

  /* ---------------- 弹出菜单（直接渲染在主页面） ----------------
     桌面版把菜单放进独立窗口，是为了不被主窗口边界裁剪；Web 版直接在主页面里用
     position:fixed 渲染即可，不必再套 iframe —— 透明 iframe 在部分浏览器里会完全不绘制，
     表现就是「点了菜单什么都没有」。 */

  let menuEl: HTMLElement | null = null;
  // 右键菜单锚点是 contextmenu 的视口坐标；浏览器里无法从屏幕坐标还原（还隔着地址栏），
  // 所以在这里最早记录一次，openMenu 为 'at' 时直接用。
  let pointerX = 0;
  let pointerY = 0;
  window.addEventListener('contextmenu', (e) => {
    pointerX = e.clientX;
    pointerY = e.clientY;
  }, true);

  function closeMenuFrame(notify = true) {
    if (menuEl && menuEl.parentElement) menuEl.parentElement.removeChild(menuEl);
    menuEl = null;
    document.getElementById('btn-menu')?.classList.remove('active');
    if (notify) fire('menu-closed');
  }

  function openMenuFrame(payload: any) {
    closeMenuFrame(false);
    if (!payload || typeof payload.html !== 'string') return;

    const box = document.createElement('div');
    box.innerHTML = payload.html;
    const el = box.firstElementChild as HTMLElement | null;
    if (!el) return;
    // Web 版没有窗口 / 托盘 / 副屏这些概念，把这些桌面专属菜单项从渲染出的菜单里去掉
    const DESKTOP_ONLY = [
      'mi-top', 'mi-pin', 'mi-login', 'mi-login-tray',
      'mi-mode', 'mi-reset', 'mi-fs-cover', 'mi-hide', 'mi-quit',
    ];
    for (const key of DESKTOP_ONLY) el.querySelector(`[data-menu-key="${key}"]`)?.remove();
    // 删完后若末尾只剩分隔线，一并去掉
    for (let i = el.children.length - 1; i >= 0; i--) {
      const child = el.children[i];
      if (!child.classList.contains('menu-sep')) break;
      child.remove();
    }
    el.removeAttribute('hidden');
    el.style.position = 'fixed';
    el.style.right = 'auto';
    el.style.zIndex = '99999';
    document.body.appendChild(el);
    menuEl = el;

    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;
    const mw = el.offsetWidth;
    const mh = el.offsetHeight;

    let left: number;
    let top: number;
    const btnRect = document.getElementById('btn-menu')?.getBoundingClientRect();
    if (payload.place === 'below-right' && btnRect) {
      // 汉堡菜单：右上角对齐按钮（与桌面版 top:44px / right:10px 的观感一致）
      left = btnRect.right + 2 - mw;
      top = btnRect.bottom + 1;
    } else {
      // 右键菜单：跟随鼠标
      left = pointerX;
      top = pointerY;
    }
    left = Math.max(8, Math.min(left, vw - mw - 8));
    top = Math.max(8, Math.min(top, vh - mh - 8));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  // 菜单项点击：必须在 pointerdown 捕获阶段先处理。
  // app.js 注册了「点击主窗口任意位置收起菜单」的捕获监听，若等到 click 再处理，
  // 菜单已经被移除，点击永远落空。本脚本先于 app.js 执行，所以这里的监听更早。
  window.addEventListener('pointerdown', (e) => {
    if (!menuEl) return;
    const target = e.target as HTMLElement | null;
    if (!target || !menuEl.contains(target)) return;
    const item = target.closest('[data-menu-key]');
    if (!item) return;
    const key = item.getAttribute('data-menu-key') || '';
    closeMenuFrame(true);
    if (key) fire('menu-action', key);
  }, true);

  /* ---------------- 登录 / 关于弹窗（iframe 承载 dialog.html） ---------------- */

  let dialogFrame: HTMLIFrameElement | null = null;
  let dialogWrap: HTMLDivElement | null = null;
  let dialogShown = false;

  function closeDialogFrame(notify = true) {
    if (dialogWrap && dialogWrap.parentElement) dialogWrap.parentElement.removeChild(dialogWrap);
    dialogWrap = null;
    dialogFrame = null;
    dialogShown = false;
    if (notify) fire('dialog-closed');
  }

  function openDialogFrame(kind: string) {
    closeDialogFrame(false);
    fire('dialog-open', kind);

    const wrap = document.createElement('div');
    wrap.id = 'openmexia-web-dialog';
    wrap.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;pointer-events:none;';
    const frame = document.createElement('iframe');
    frame.src = `dialog.html?kind=${encodeURIComponent(kind || 'login')}`;
    frame.setAttribute('frameborder', '0');
    frame.style.cssText = 'border:0;background:transparent;pointer-events:auto;width:300px;height:300px;color-scheme:normal;';
    wrap.appendChild(frame);
    document.body.appendChild(wrap);
    dialogWrap = wrap;
    dialogFrame = frame;

    frame.addEventListener('load', () => {
      getInit().then((info) => {
        frame.contentWindow?.postMessage({
          type: 'openmexia:dialog-data',
          data: {
            kind,
            id: 1,
            version: info && info.version ? info.version : '',
            theme: document.documentElement.classList.contains('light') ? 'light' : 'dark',
          },
        }, location.origin);
      }).catch(() => { /* ignore */ });
    });
  }

  if (isTop) {
    window.addEventListener('message', (e) => {
      if (e.origin !== location.origin) return;
      const d: any = e.data;
      if (!d || typeof d.type !== 'string') return;

      if (d.type === 'openmexia:menu-action') {
        const key = typeof d.key === 'string' ? d.key : '';
        closeMenuFrame(true);
        if (key) fire('menu-action', key);
        return;
      }

      if (d.type === 'openmexia:menu-close') {
        closeMenuFrame(true);
        return;
      }

      if (d.type === 'openmexia:dialog-size') {
        const frame = dialogFrame;
        if (!frame) return;
        const PAD = 56;
        const w = Math.max(1, Math.round(d.width)) + PAD * 2;
        const h = Math.max(1, Math.round(d.height)) + PAD * 2;
        frame.style.width = Math.min(w, document.documentElement.clientWidth - 16) + 'px';
        frame.style.height = Math.min(h, document.documentElement.clientHeight - 16) + 'px';
        // 同菜单：直接通知显示，避免 rAF 被浏览器节流导致弹窗迟迟不出现
        if (!dialogShown) {
          dialogShown = true;
          frame.contentWindow?.postMessage({ type: 'openmexia:dialog-shown' }, location.origin);
        }
        return;
      }

      if (d.type === 'openmexia:dialog-close') {
        closeDialogFrame(true);
      }
    });
  }

  /* ---------------- 桥接对象 ---------------- */

  const applyFullscreen = (mode: string | null) => {
    try {
      if (mode) {
        document.documentElement.requestFullscreen?.().catch(() => { /* 被浏览器拒绝时忽略 */ });
      } else if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => { /* ignore */ });
      }
    } catch { /* ignore */ }
    fire('fullscreen-state', mode);
  };

  const api: any = {
    init: () => getInit(),
    onDevices: (cb: Cb) => on('devices', cb),
    onSettings: (cb: Cb) => on('settings', cb),

    setPower: (id: string, on_: boolean) => post('/api/device/power', { id, on: on_ }),
    setBrightness: (id: string, value: number) => post('/api/device/brightness', { id, value }),
    setColorTemperature: (id: string, value: number) => post('/api/device/color-temperature', { id, value }),
    setSpeed: (id: string, value: number) => post('/api/device/speed', { id, value }),
    setField: (id: string, field: string, value: any) => post('/api/device/field', { id, field, value }),
    callAction: (id: string, key: string) => post('/api/device/action', { id, key }),

    // 桌面专属能力：Web 版没有对应概念，做成安全的空操作
    hide: () => {},
    resize: () => {},
    quit: () => {},
    setTheme: (theme: string) => post('/api/theme', { theme }),
    toggleOnTop: () => {},
    pinTaskbar: () => {},
    toggleLogin: () => {},
    toggleLaunchInTray: () => {},
    sendToSecondScreen: () => {},
    fullscreen: (mode: string | null) => applyFullscreen(mode),
    onFullscreenState: (cb: Cb) => on('fullscreen-state', cb),
    setMenuIcons: () => {},
    toggleWindowMode: () => {},
    onWindowMode: (cb: Cb) => on('window-mode', cb),
    reportRoomState: () => {},
    onToggleRoom: (cb: Cb) => on('toggle-room', cb),
    onOpenPanel: (cb: Cb) => on('open-panel', cb),
    onToggleTheme: (cb: Cb) => on('toggle-theme', cb),
    onTitlebarMenu: (cb: Cb) => on('titlebar-menu', cb),

    // 弹出菜单
    openMenu: (payload: any) => {
      if (!isTop) return;
      openMenuFrame(payload);
    },
    closeMenu: () => {
      if (isTop) closeMenuFrame(true);
      else postToParent({ type: 'openmexia:menu-close' });
    },
    onMenuAction: (cb: Cb) => on('menu-action', cb),
    onMenuClosed: (cb: Cb) => on('menu-closed', cb),
    onMenuData: (cb: Cb) => on('menu-data', cb),
    menuSize: (width: number, height: number, id: number) =>
      postToParent({ type: 'openmexia:menu-size', width, height, id }),
    menuAction: (key: string, id: number) =>
      postToParent({ type: 'openmexia:menu-action', key, id }),
    onMenuShown: (cb: Cb) => on('menu-shown', cb),

    // 登录 / 关于弹窗
    openDialog: (kind: string) => {
      if (!isTop) return;
      openDialogFrame(kind);
    },
    closeDialog: () => {
      if (isTop) closeDialogFrame(true);
      else postToParent({ type: 'openmexia:dialog-close' });
    },
    onDialogOpen: (cb: Cb) => on('dialog-open', cb),
    onDialogClosed: (cb: Cb) => on('dialog-closed', cb),
    onDialogData: (cb: Cb) => on('dialog-data', cb),
    dialogSize: (width: number, height: number, id: number) =>
      postToParent({ type: 'openmexia:dialog-size', width, height, id }),
    dialogClose: () => postToParent({ type: 'openmexia:dialog-close' }),
    onDialogShown: (cb: Cb) => on('dialog-shown', cb),
    onDialogReset: (cb: Cb) => on('dialog-reset', cb),

    openExternal: (url: string) => {
      if (typeof url === 'string' && /^https?:\/\//i.test(url)) window.open(url, '_blank', 'noopener,noreferrer');
    },
    checkUpdate: () => call('/api/check-update').catch(() => ({
      ok: false, current: '', latest: '', hasUpdate: false, url: '',
    })),

    // 登录 / 设备管理
    loginStatus: () => call('/api/login/status'),
    loginPassword: (payload: any) => call('/api/login/password', payload || {}),
    loginCaptcha: (payload: any) => call('/api/login/captcha', payload || {}),
    loginRefreshCaptcha: (payload: any) => call('/api/login/refresh-captcha', payload || {}),
    loginQR: () => call('/api/login/qr', {}),
    refreshDevices: () => call('/api/refresh-devices', {}),
    logout: () => call('/api/logout', {}),
    getHomes: () => call('/api/homes'),
    setHome: (homeId: string) => call('/api/home', { homeId }),
    onQR: (cb: Cb) => on('qr', cb),
    onLoginState: (cb: Cb) => on('login-state', cb),
  };

  (window as any).mijia = api;

  // 菜单 / 弹窗 iframe 里没有主界面，不需要订阅设备事件流
  if (!isMenuFrame) connectEvents();
})();

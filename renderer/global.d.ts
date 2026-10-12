/**
 * 渲染层全局声明：让编辑器 / typecheck 认识 preload 暴露的 `window.mijia`。
 * 纯声明，不改运行时。
 */

import type { IpcApi } from '../shared/ipc';

declare global {
  interface Window {
    mijia: IpcApi;
  }
}

export {};

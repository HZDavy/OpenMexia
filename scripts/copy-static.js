// 阶段 2 构建辅助：把 tsc 不产出的静态资源镜像进 build/，
// 使 build/ 成为自洽的可运行目录 —— main.js 里的 __dirname 相对路径
// （assets/、preload.js、renderer/index.html）都会解析到 build/ 下。
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'build');

// renderer 的静态资源原样镜像。renderer/app.js 不在此列：
// 阶段 4 起它由 renderer/app.ts 经 esbuild 打包为 IIFE（见 package.json 的 build:renderer），
// 单独产出到 build/renderer/app.js，避免被 tsc 当作 CJS 注入 exports。
fs.mkdirSync(path.join(out, 'renderer'), { recursive: true });
for (const f of ['index.html', 'style.css']) {
  fs.copyFileSync(path.join(root, 'renderer', f), path.join(out, 'renderer', f));
}

// assets 整体镜像（图标 / logo，供主进程与 index.html 引用）
fs.cpSync(path.join(root, 'assets'), path.join(out, 'assets'), { recursive: true });

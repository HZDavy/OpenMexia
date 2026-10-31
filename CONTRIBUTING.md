# 参与贡献

感谢参与 OpenMexia。这个仓库维护 Windows 桌面版（Electron + TypeScript）；macOS、Linux、
iOS、Android 等平台在路线图上，会在同一套设备核心上做原生适配。

## 报告问题

提交前请先搜索现有 Issue，并确认问题仍能在最新版本或当前源码中复现。普通问题直接开
Issue；安全漏洞按 [`SECURITY.md`](SECURITY.md) 私密报告。

问题报告请写清：

- 使用的 release 版本号、commit，或安装包文件名；
- Windows 版本、米家账号登录状态，以及涉及的设备类型与型号；
- 最短复现步骤、实际结果和预期结果；
- 已执行的相关检查及其真实结果（例如 `npm run typecheck`）。

不要上传米家账号密码、登录 token、设备 did、真实设备名、局域网 IP、`userData` 里的
配置文件、完整日志或个人绝对路径。

## 本地开发

需要 Node.js 18+ 与 npm：

```bash
npm install
npm start          # 编译后启动 Electron
npm run typecheck  # TypeScript 类型检查
npm run build      # 只编译，不启动
npm run dist       # 构建 Windows x64 NSIS 安装包，产物在 release/
```

`npm run dist` 会调用 electron-builder。完整打包与真机验收不是每个改动的默认步骤：设备
控制、云端会话续期和长期运行仍需在真实米家账号与设备上人工检查。

## 提交修改

- 保持改动围绕一个明确问题，不顺带重构无关模块；
- 新增依赖时同步更新 `package.json` 与 README 的第三方组件表，并确认许可兼容
  （本项目为 `AGPL-3.0-or-later`）；
- 不提交米家账号数据、`userData` 导出、日志、`node_modules`、`build`、`release` 或签名材料；
- 行为变化要说明验证方式：至少 `npm run typecheck` 通过，涉及设备控制的改动写明实测情况；
- Pull Request 说明问题、方案、验证结果和仍未完成的人工项。

向本仓库提交代码或文档，表示贡献者有权提供这些内容，并同意按项目现行的
`AGPL-3.0-or-later` 许可证发布。第三方代码和素材必须同时保留原始许可与归属。

# 米家小组件

Windows 桌面版米家小组件：一个常驻桌面的小窗，实时展示并控制你的米家设备。基于 Electron 构建。

## 功能

- **米家账号扫码登录**，设备列表与状态自动同步
- **设备卡片瀑布流布局**，支持拖动排序、双击（或右键）收折
- 设备控制：开关、亮度、色温、风扇风速 / 模式 / 扫风、空调目标温度、净饮机水温等
- 窗口常驻置顶，可拖动缩放，自动记住窗口位置、大小与各项设置
- 系统托盘菜单，支持开机自启
- 两种全屏：普通全屏（任务栏可见）/ 覆盖全屏
- 多显示器支持：一键发送到副屏
- 网关、温湿度计等不可控设备只展示状态，不显示开关

## 下载安装

到 [Releases](../../releases) 页面下载 `米家小组件 Setup x.x.x.exe`，运行后按提示安装（可自选安装目录）。

> **关于 SmartScreen 提示**：本软件为个人开源项目，安装包暂未购买代码签名证书。首次运行时 Windows 可能弹出「已保护你的电脑」，点击「更多信息」→「仍要运行」即可。软件完全开源，可自行审计源码或从源码构建。

## 从源码运行

需要 Node.js 18+。

```bash
npm install
npm start
```

## 从源码构建安装包

```bash
npm install
npm run dist
```

产物输出在 `dist/` 目录（NSIS 安装包，x64）。

## 隐私说明

- 米家登录凭据与设备数据仅保存在本机应用数据目录（Electron `userData`）下，不会上传到除米家官方接口以外的任何服务器。
- 本项目不内置任何账号、密码或设备 Token。

## 免责声明

本项目为个人学习交流用途的**非官方**软件，与小米 / 米家官方无任何关联，亦未获其授权或背书。所使用的接口均来自公开开源项目，接口可能随时变更或失效。使用本软件产生的任何账号风险与损失由使用者自行承担。请在遵守米家相关服务条款的前提下使用。

## License

本项目基于 **GNU AGPL-3.0-or-later** 发布，全文见 [LICENSE](LICENSE)。

之所以采用 AGPL 而非宽松协议，是因为本项目依赖 GPL-3.0-or-later 的 [`@zythum02/mijia-api`](https://github.com/zythum/mijia-api)，作为衍生作品须以 GPL 兼容协议分发。这意味着：你可以自由使用、修改和再分发，但**修改后的版本（包括通过网络提供服务的情形）必须同样以 AGPL 开源并提供完整源码**。

### 第三方开源组件

| 组件 | 许可证 |
|---|---|
| [@zythum02/mijia-api](https://github.com/zythum/mijia-api) | GPL-3.0-or-later |
| [node-mihome](https://github.com/maxinminax/node-mihome) | MIT |
| [qrcode](https://github.com/soldair/node-qrcode) | MIT |
| [Electron](https://github.com/electron/electron) | MIT |


[![🌐 访问官网](https://img.shields.io/badge/%E2%9C%82%E8%AE%BF%E9%97%AE%E5%AE%98%E7%BD%91-%E7%82%B9%E5%87%BB%E6%89%93%E5%BC%80-2dd47a?style=for-the-badge&logo=internet-explorer&logoColor=white)](https://hzdavy.github.io/OpenMexia/)
# <img src="https://hzdavy.github.io/OpenMexia/docs/logo.svg" width="30" height="30" alt="logo"> OpenMexia
[![Release](https://img.shields.io/github/v/release/HZDavy/OpenMexia?color=%232dd47a&label=Release&logo=github)](https://github.com/HZDavy/OpenMexia/releases) [![License](https://img.shields.io/github/license/HZDavy/OpenMexia?color=blue&label=License)](LICENSE) [![Downloads](https://img.shields.io/github/downloads/HZDavy/OpenMexia/latest/total?color=blueviolet&label=Downloads)](https://github.com/HZDavy/OpenMexia/releases/latest) [![Last-Release](https://img.shields.io/github/release-date/HZDavy/OpenMexia?color=green&label=Last-Release)](https://github.com/HZDavy/OpenMexia/releases/latest) ![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11%20x64-0078D6) ![Electron](https://img.shields.io/badge/Electron-44-47848F?logo=electron&logoColor=white) ![Node](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white) [![Website](https://img.shields.io/website?up_color=2dd47a&up_message=online&label=%E5%AE%98%E7%BD%91&url=https%3A%2F%2Fhzdavy.github.io%2FOpenMexia%2F)](https://hzdavy.github.io/OpenMexia/)
> 目标是支持所有智能协议——任何品牌，不只是小米；凡能以开源方式支持的协议都尽力纳入。**目前已支持米家。**

OpenMexia 是一个**开源、全平台、多协议**的智能家居控制中枢。它不绑定任何一家品牌，旨在支持所有智能协议，力图把一切能以开源方式支持的协议都纳入其中——任何品牌，不只是小米。目标是把不同厂商、不同协议（Wi-Fi、蓝牙、Zigbee、Matter 等）的设备，汇聚到同一个**由你本地掌控**的控制台里。**目前已完成对米家的支持。**

项目当前提供 **Windows 桌面版**（基于 Electron，常驻小窗 + 瀑布流设备卡片）；**macOS、iOS、Android、Linux、鸿蒙（HarmonyOS）已列入路线图**，目标是让账号、卡片与交互在各平台保持一致，只做平台原生的适配，不重做体验。

---
## 命名寓意
**OpenMexia** 由 **Open + Me + X + ia** 组成（核心词 Mexia，5 个字母），发音 /miːˈzi.ə/，拼音读作「米夏」——口型与「米家（Mijia）」几乎一致，既是致敬起点，也一路走向跨界融合与宏大生态。

| 词素 | 寓意 |
|---|---|
| **Open** | 开源精神与无界底座：明确宣告项目的开源属性，代表打破单一品牌（如小米）的生态壁垒，致力于构建一个能接入所有开放 API 乃至全协议（如 Matter）设备的无界控制底座。 |
| **Me** | 听觉传承与私有属性：发音上承接「米（Mi）」的记忆，暗示项目从「米家设备接入」起步的开发渊源；同时 `Me` 即「我」，强调这是一个完全由用户本地掌控、不受大厂云端限制的私人智能中枢。 |
| **X** | 跨界互联与无限扩展：`X` 是 Cross（跨平台 / 跨协议）的核心符号，象征原本互不相通的设备与协议（Wi-Fi、蓝牙、Zigbee、Matter 等）在此节点交叉互联；作为数学中的无限变量，也寓意平台未来接入万物的无限潜力。 |
| **ia** | 生态疆域与系统级平台：在拉丁语词根与现代科技命名体系（如 Wikipedia、Symbia）中，后缀 `-ia` 指代「广阔的领域、国度或生态系统」，表明 OpenMexia 不是一个简单的控制脚本，而是包容海量硬件节点的完整数字家园。 |

---
## 平台支持与路线图

| 平台 | 状态 | 说明 |
|---|---|---|
| Windows 10 / 11（x64） | ✅ 已发布 v0.1.0 | NSIS 安装包，见 [Releases](https://github.com/HZDavy/OpenMexia/releases) |
| macOS | 🚧 规划中 | 桌面端基于 Electron，是下一个目标平台 |
| iOS（iPhone / iPad） | 📋 计划中 | 复用同一套设备核心，保持卡片交互一致 |
| Android（手机 / 平板） | 📋 计划中 | 同 iOS |
| Linux | 🚧 规划中 | 桌面端同样基于 Electron，可与 Windows 共用一套代码 |
| 鸿蒙（HarmonyOS） | 📋 计划中 | 面向鸿蒙手机与平板，纳入长期规划 |

### 生态与协议接入

> 当前版本**仅支持米家**，但项目的目标远不止米家：它要支持所有智能协议，力图把一切能以开源方式支持的协议都纳入其中——任何品牌，不只是小米。其余生态与协议将按「开放接口完善度 + 接入稳定性」逐步评估与接入。

| 生态 / 协议 | 当前状态 | 说明 |
|---|---|---|
| 米家（MIoT） | ✅ 已支持 | 通过米家账号扫码登录，设备状态与卡片自动同步 |
| Matter | 🚧 计划优先支持 | 跨厂商通用标准，作为打通各家设备的统一底座，优先级最高 |
| 其他厂商开放接口 | ⏳ 后续评估 | 按各厂商是否提供稳定、可用的开放 API 依次接入 |

路线进展与讨论见 [GitHub Issues](https://github.com/HZDavy/OpenMexia/issues)，欢迎参与贡献。

---
## Windows 版功能

- **米家账号扫码登录**，设备列表与状态自动同步
- **设备卡片瀑布流布局**，支持拖动排序、双击（或右键）收折
- 设备控制：开关、亮度、色温、风扇风速 / 模式 / 扫风、空调目标温度、净饮机水温等
- 窗口常驻置顶，可拖动缩放，自动记住窗口位置、大小与各项设置
- 系统托盘菜单，支持开机自启
- 两种全屏：普通全屏（任务栏可见）/ 覆盖全屏
- 多显示器支持：一键发送到副屏
- 网关、温湿度计等不可控设备只展示状态，不显示开关

---
## 下载安装

到 [Releases](https://github.com/HZDavy/OpenMexia/releases) 页面下载 `OpenMexia-Setup-x.x.x.exe`，运行后按提示安装（可自选安装目录）。

> **关于 SmartScreen 提示**：本软件为个人开源项目，安装包暂未购买代码签名证书。首次运行时 Windows 可能弹出「已保护你的电脑」，点击「更多信息」→「仍要运行」即可。软件完全开源，可自行审计源码或从源码构建。

---
## 从源码运行

需要 Node.js 18+。

```bash
npm install
npm start
```

---
## 从源码构建安装包

```bash
npm install
npm run dist
```

产物输出在 `release/` 目录（当前构建脚本仅打包 Windows x64 NSIS 安装包；macOS / Linux / 移动端构建将随对应平台支持一同提供）。

---
## 隐私说明

- 米家登录凭据与设备数据仅保存在本机应用数据目录（Electron `userData`）下，不会上传到除米家官方接口以外的任何服务器。
- 本项目不内置任何账号、密码或设备 Token。

---
## 免责声明

本项目为个人学习交流用途的**非官方**软件，与小米 / 米家官方无任何关联，亦未获其授权或背书。所使用的接口均来自公开开源项目，接口可能随时变更或失效。使用本软件产生的任何账号风险与损失由使用者自行承担。请在遵守米家相关服务条款的前提下使用。

---
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

<h1 align="center">月饼消消乐</h1>
<p align="center"><img src="./public/assets/images/tile-classic.png" width="128" height="128" alt="Mooncake"></p>
<p align="center"><strong>React + Vite + TypeScript 构建的中秋主题三消小游戏。</strong></p>
<p align="center">
  <a href="./LICENSE"><img alt="MIT code license" src="https://img.shields.io/badge/code-MIT-blue"></a>
  <a href="https://github.com/Azure12355/mooncake-match/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/Azure12355/mooncake-match"></a>
</p>
<p align="center"><a href="./README.md">English</a> · <strong>简体中文</strong></p>

[在线试玩](https://pages.weilanx.com/games/mooncake-match/)

## 功能

- 8 列 × 7 行、8 种棋子，支持点击或滑动交换相邻棋子。
- 20 步内收集花纹月饼 12 个、玉兔 8 个、灯笼 8 个。
- 高频连消、四种免费道具，无有效交换时自动重排。
- 一屏适配、桂花鎏金边框和桌面中秋外围背景。
- 音乐与音效开关、切到后台暂停、浏览器保存最高分。

纯前端，无账号、后端、支付或在线排行榜。刷新后开始新局，交互后播放音乐。开源版使用程序合成配乐，线上演示可能使用不同音乐。

## 快速开始

使用 Node.js 24 和 npm，在仓库根目录运行：

```sh
npm ci
npm run dev
```

打开 Vite 输出的地址。

```sh
npm test
npm run lint
npm run build
node scripts/simulate-game.ts
```

构建产物为 `dist/`。托管到子目录时指定实际基础路径，例如：

```sh
npm run build -- --base=/games/mooncake-match/
```

## Agent 快速上手

修改前阅读 [AGENTS.md](./AGENTS.md)。仅修改任务范围，保留其他改动与现有美术。浏览器交互须先获得用户明确同意，不公开凭据或私人音乐。

| 入口 | 用途 |
|---|---|
| [PRD](./docs/PRD.md) | 产品规则和范围 |
| `src/config.ts` | 棋盘、目标、道具、连消参数 |
| `src/game.ts` | 纯规则引擎和动画计划 |
| `src/App.tsx`、`src/App.css`、`src/index.css` | 界面、输入和一屏适配 |
| `src/useAudio.ts`、`src/storage.ts` | 音频与偏好 |
| `tests/` | 规则与存储验证 |
| [平衡性说明](./docs/BALANCE.md) | 可复现的 300 局模拟 |
| [素材清单](./docs/ASSETS.md) | 素材和生成提示词 |

修改相关实现和文档后按需运行上述命令，如实报告验证。规则变更须保留真实匹配、准确计分和 10 轮连消上限。概率调整须进行前后模拟，模拟不能证明玩家留存。

## 验证与限制

20 项单元测试及生产构建通过。代码检查有两条非阻断的 effect 状态更新警告。尚未完成浏览器交互、实际音乐试听及跨设备视觉验收；资源可访问不等于游戏体验已验收。

## 贡献与安全

参见 [CONTRIBUTING.md](./CONTRIBUTING.md) 和 [SECURITY.md](./SECURITY.md)。

## 许可证

代码和文档采用 [MIT](./LICENSE)。字体和图片另见 [ASSET-LICENSES.md](./ASSET-LICENSES.md)，私人音乐不包含在公开版本中。

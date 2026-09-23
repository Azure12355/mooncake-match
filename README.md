# 月饼消消乐

React + Vite + TypeScript 纯前端中秋三消小游戏，手机竖屏优先，电脑居中展示。20 步内收集花纹月饼 12 个、兔子 8 个和灯笼 8 个。无需后端。

已实现相邻点击/滑动交换、匹配与连锁、四种道具、死局免费重排、胜负结算、设置和重开、背景音乐和音效，以及本地最高分与声音设置。刷新开始新局，不保存棋盘。

## 本地运行

使用 Node.js 24 或更高版本（测试使用 Node 原生 TypeScript 支持）。

```sh
npm install
npm run dev
```

手动打开终端输出的本地地址。若默认端口被占用，Vite 自动选择空闲端口。

```sh
npm test
npm run lint
npm run build
```

## 文件

- `docs/PRD.md`：游戏规则、交互及验收要求。
- `docs/PLAN.md`：实现进度与待验收项目。
- `docs/ASSETS.md`：20 张核心图片与 7 个音频清单；另有 3 张外围背景，见 `docs/OUTER-BACKGROUNDS.md`。
- `docs/image-prompts.json`：内置 imagegen 的最终生成提示词。
- `src/game.ts`：纯函数规则引擎和动画步骤。
- `src/App.tsx`：游戏界面、点击/触摸操作、动画播放和弹窗。
- `src/useAudio.ts`：首次交互解锁、后台暂停及声音开关。
- `src/storage.ts`：仅保存最高分和声音设置。
- `tests/`：规则和本地存储测试。
- `scripts/generate-audio.py`：本地原创合成音频，可复现。

全部图片由内置 imagegen 生成，背景以外的 19 张带透明通道。原始 PNG 总计约 24.7 MiB，首屏会等待素材加载，失败可重试；音频为原创程序合成 WAV，不是 imagegen 输出。

20 项单元测试、类型检查、lint 和生产构建已通过。尚未进行浏览器交互、实际音频试听、截图视觉及试玩难度验收；未部署或发布。

## 连消模式

开局优先提供更多有效交换；新补入棋子按递减概率助攻，连续消除越来越快，每手最多 10 轮。当前以轻松解压为主，20 步和原有收集目标保持不变。运行 `node scripts/simulate-game.ts` 可重现固定种子的 300 局模拟，详见 docs/BALANCE.md。

桌面外围背景按窗口宽高比自动切换 4:3、16:9、21:9 三种构图。宽度不超过 660px 时仅显示原游戏，外围图片不加入游戏预加载。

## EdgeOne 发布

线上地址：https://pages.weilanx.com/games/mooncake-match/

子目录构建：`npm run build -- --base=/games/mooncake-match/`。
将构建产物放入 `../weilanx-pages/public/games/mooncake-match/`，在聚合站运行 `npm run build`，然后部署整个聚合站的 `dist` 到 `weilanx-pages`。不要单独部署游戏目录覆盖聚合站。

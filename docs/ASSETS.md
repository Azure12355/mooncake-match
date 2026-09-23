# 素材清单

图片由 imagegen 内置工具生成。清单根据实际文件自动更新，缺失项不使用占位图替代。完整提示词见 image-prompts.json。

| 文件 | 状态 | 尺寸 | Alpha |
|---|---|---|---|
| background.png | 已生成 | 941 × 1672 | False |
| tile-classic.png | 已生成 | 1254 × 1254 | True |
| tile-rose.png | 已生成 | 1254 × 1254 | True |
| tile-matcha.png | 已生成 | 1254 × 1254 | True |
| tile-snow.png | 已生成 | 1254 × 1254 | True |
| tile-yolk.png | 已生成 | 1254 × 1254 | True |
| tile-cocoa.png | 已生成 | 1254 × 1254 | True |
| tile-rabbit.png | 已生成 | 1254 × 1254 | True |
| tile-lantern.png | 已生成 | 1254 × 1254 | True |
| tool-hammer.png | 已生成 | 1254 × 1254 | True |
| tool-shuffle.png | 已生成 | 1254 × 1254 | True |
| tool-rainbow.png | 已生成 | 1254 × 1254 | True |
| tool-bomb.png | 已生成 | 1254 × 1254 | True |
| title.png | 已生成 | 1774 × 887 | True |
| panel.png | 已生成 | 1448 × 1086 | True |
| button.png | 已生成 | 2172 × 724 | True |
| icon-settings.png | 已生成 | 1254 × 1254 | True |
| effect-sparkle.png | 已生成 | 1254 × 1254 | True |
| result-win.png | 已生成 | 1254 × 1254 | True |
| result-lose.png | 已生成 | 1254 × 1254 | True |

## 使用方式

全部图片保存于 public/assets/images。棋子与道具用 object-fit: contain 保留完整轮廓；通用面板用于棋盘、状态栏及弹窗；通用按钮配 React 文案复用。背景是完整竖图，其余成功生成的文件有透明通道。生成结果已逐张查看，尚未进行浏览器视觉与交互验收。

## 音频

以下均为 scripts/generate-audio.py 原创合成的 PCM WAV，单声道、22050Hz、16bit；不是 imagegen 生成。已检查文件格式与时长，尚未试听验收。

| 文件 | 时长 |
|---|---|
| bgm.wav | 24.00s |
| invalid.wav | 0.28s |
| lose.wav | 1.60s |
| match.wav | 0.55s |
| swap.wav | 0.22s |
| tool.wav | 0.85s |
| win.wav | 2.20s |

## 生成状态

20 张图片已全部生成并保存在工程中。使用内置 imagegen，未使用 CLI/API 备用路径。

运行 python3 scripts/inventory-assets.py 可刷新清单及预览页状态。

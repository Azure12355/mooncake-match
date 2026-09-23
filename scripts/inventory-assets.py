"""Record actual generated files; never infer success from a planned prompt."""
from pathlib import Path
import json
import struct
import wave

root = Path(__file__).resolve().parents[1]
prompts = json.loads((root / 'docs/image-prompts.json').read_text())
rows = []
for asset in prompts:
    file = root / 'public/assets/images' / (asset['id'] + '.png')
    row = {'id': asset['id'], 'status': 'missing'}
    if file.exists():
        data = file.read_bytes()
        assert data[:8] == b'\x89PNG\r\n\x1a\n'
        w, h, depth, color = struct.unpack('>IIBB', data[16:26])
        row.update(status='generated', width=w, height=h, bytes=len(data), alpha=color in (4, 6))
        assert asset['id'] == 'background' or row['alpha'], file
    rows.append(row)
(root / 'src/asset-status.json').write_text(json.dumps(rows, indent=2)+'\n')
lines = ['# 素材清单', '', '图片由 imagegen 内置工具生成。清单根据实际文件自动更新，缺失项不使用占位图替代。完整提示词见 image-prompts.json。', '', '| 文件 | 状态 | 尺寸 | Alpha |', '|---|---|---|---|']
for row in rows:
    size = f"{row['width']} × {row['height']}" if row['status']=='generated' else '—'
    alpha = str(row.get('alpha', '—'))
    lines.append(f"| {row['id']}.png | {'已生成' if row['status']=='generated' else '待生成'} | {size} | {alpha} |")
lines += ['', '## 使用方式', '', '全部图片保存于 public/assets/images。棋子与道具用 object-fit: contain 保留完整轮廓；通用面板用于棋盘、状态栏及弹窗；通用按钮配 React 文案复用。背景是完整竖图，其余成功生成的文件有透明通道。生成结果已逐张查看，尚未进行浏览器视觉与交互验收。', '', '## 音频', '', '以下均为 scripts/generate-audio.py 原创合成的 PCM WAV，单声道、22050Hz、16bit；不是 imagegen 生成。已检查文件格式与时长，尚未试听验收。', '', '| 文件 | 时长 |', '|---|---|']
for file in sorted((root/'public/assets/audio').glob('*.wav')):
    with wave.open(str(file)) as audio:
        assert audio.getnchannels()==1 and audio.getsampwidth()==2
        lines.append(f'| {file.name} | {audio.getnframes()/audio.getframerate():.2f}s |')
missing = [row['id'] for row in rows if row['status'] != 'generated']
lines += ['', '## 生成状态', '', ('仍待生成：' + '、'.join(missing)) if missing else '20 张图片已全部生成并保存在工程中。使用内置 imagegen，未使用 CLI/API 备用路径。', '', '运行 python3 scripts/inventory-assets.py 可刷新清单及预览页状态。']
(root/'docs/ASSETS.md').write_text('\n'.join(lines)+'\n')
print(f"Images: {sum(r['status']=='generated' for r in rows)}/{len(rows)}; WAV files verified.")

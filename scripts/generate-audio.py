"""Original synthesized pentatonic music and cues; Python standard library only."""
from pathlib import Path
import math
import struct
import wave

ROOT = Path(__file__).resolve().parents[1] / 'public/assets/audio'
RATE = 22050

def render(name, duration, notes, volume=0.5):
    data = [0.0] * round(duration * RATE)
    for start, midi, length, gain in notes:
        frequency = 440 * 2 ** ((midi - 69) / 12)
        for i in range(round(length * RATE)):
            index = round(start * RATE) + i
            if index >= len(data):
                break
            t = i / RATE
            envelope = min(t / 0.012, 1) * math.exp(-3.6 * t / length)
            envelope *= min((length - t) / 0.08, 1)
            tone = (math.sin(2 * math.pi * frequency * t)
                    + 0.22 * math.sin(2 * math.pi * frequency * 2 * t)
                    + 0.07 * math.sin(2 * math.pi * frequency * 3 * t))
            data[index] += tone * envelope * gain
    peak = max(max(abs(x) for x in data), 1)
    with wave.open(str(ROOT / f'{name}.wav'), 'wb') as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes(b''.join(struct.pack('<h', round(x / peak * volume * 32767)) for x in data))

ROOT.mkdir(parents=True, exist_ok=True)
# A newly composed 16-bar pentatonic melody; no sampled or existing recording.
melody = [72, 76, 79, 76, 74, 72, 69, 72, 76, 79, 81, 79, 76, 74, 72, 69,
          72, 74, 76, 79, 81, 79, 76, 74, 72, 69, 67, 69, 72, 76, 74, 72]
notes = [(i * .75, pitch, 1.2, .42) for i, pitch in enumerate(melody)]
notes += [(i * 3, root, 2.4, .20) for i, root in enumerate([48, 53, 55, 48, 57, 53, 55, 48])]
render('bgm', 24, notes, .42)
render('swap', .22, [(0, 76, .12, .7), (.07, 79, .13, .5)])
render('invalid', .28, [(0, 64, .12, .5), (.10, 60, .16, .4)])
render('match', .55, [(0, 79, .3, .6), (.09, 84, .36, .6), (.17, 88, .32, .4)])
render('tool', .85, [(i * .09, p, .4, .5) for i, p in enumerate([60, 67, 72, 76, 79])])
render('win', 2.2, [(i * .21, p, .85, .5) for i, p in enumerate([72, 76, 79, 84, 79, 84])])
render('lose', 1.6, [(i * .26, p, .7, .4) for i, p in enumerate([76, 74, 72, 67])])
print('Generated 7 original WAV assets.')

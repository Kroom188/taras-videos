"""Mix BGM + sample SFX for engine/intro.html.
usage: python3 engine/intro_audio.py events.json out.wav
events.json: {duration, music:{f,offset}, sfx:[{t,f,g,dur?} | {t,type:'riser',dur,g}]}"""
import json, sys, subprocess, numpy as np, os
sys.path.insert(0, os.path.dirname(__file__))
from audio import riser, write
SR = 44100
D = os.path.join(os.path.dirname(__file__), 'sfx')
def load(f, ss=0, dur=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', os.path.join(D, f), '-ss', str(ss)] + (['-t', str(dur)] if dur else []) + ['-f', 'f32le', '-ac', '2', '-ar', str(SR), '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32).reshape(-1, 2).copy()
ev = json.load(open(sys.argv[1])); dur = ev['duration']; n = int(SR * dur)
mus = load(ev['music']['f'], ev['music']['offset'], dur)[:n]
mus = np.pad(mus, ((0, n - len(mus)), (0, 0)))
fx = np.zeros((n, 2)); hits = []
for e in ev['sfx']:
    if e.get('type') == 'riser':
        r = riser(e['dur']); r = np.stack([r, r], 1) * e['g']
    else:
        r = load(e['f'], 0, e.get('dur')) * e['g']
        if e['f'].startswith(('bass-hit', 'impact')): hits.append(e['t'])
    i = int(e['t'] * SR); r = r[:max(0, n - i)]; fx[i:i + len(r)] += r
t = np.arange(n) / SR
duck = np.ones(n)
for h in hits: duck -= 0.35 * np.exp(-((t - h - 0.15) / 0.3) ** 2)
mix = mus * 0.62 * duck[:, None] + fx * 0.9
mix *= (np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 1.2))[:, None]
mix = np.tanh(mix * 1.2) / np.tanh(1.2)
mix = mix / (np.abs(mix).max() + 1e-9) * 0.86
write(sys.argv[2], mix)

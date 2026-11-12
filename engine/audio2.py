"""Music + SFX from an events JSON written by render2.js.
usage: python3 engine/audio2.py events.json out.wav"""
import json, sys, numpy as np
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from audio import SR, t_arr, add, music, whoosh, pop, tick, riser, ding, impact, write

def click():
    t = t_arr(0.06)
    return (np.sin(2*np.pi*1800*t)*0.6 + np.sin(2*np.pi*3200*t)*0.3) * np.exp(-t*90) * 0.5

ev = json.load(open(sys.argv[1]))
D = ev["duration"]
sfx = np.zeros(int(SR * D))
scene_starts = []
for e in ev["events"]:
    ty, t = e["type"], e["t"]
    if ty == "impact": add(sfx, impact(), t)
    elif ty == "whoosh": add(sfx, whoosh(0.6), max(0, t - 0.3)); scene_starts.append(t)
    elif ty == "tick": add(sfx, tick() * 0.7, t)
    elif ty == "pop": add(sfx, pop(e.get("f", 1000)), t)
    elif ty == "click": add(sfx, click(), t)
    elif ty == "ding": add(sfx, ding(), t)
    elif ty == "riser_end": pass
m = music(D)[:len(sfx)]
t = t_arr(D)
duck = np.ones_like(t)
for b in scene_starts:
    duck -= 0.3 * np.exp(-((t - b) / 0.25) ** 2)
mix = m * duck * 0.5 + sfx
mix *= np.minimum(1, t / 0.05) * np.minimum(1, (D - t) / 0.8)
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
mix = mix / (np.abs(mix).max() + 1e-9) * 0.89
write(sys.argv[2], np.stack([mix, np.roll(mix, 120) * 0.98], 1))

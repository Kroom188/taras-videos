"""Generate music + synced SFX for each video in a content JSON.

usage: python3 engine/audio.py engine/content-YYYY-MM-DD.json OUT_DIR
writes OUT_DIR/audio_NN.wav (duration of each item). All sound is synthesized
here, so there are no copyright issues.
Timeline constants must match template.html (T and element delays).
"""
import json, sys, os, wave
import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def t_arr(d):
    return np.arange(int(SR * d)) / SR




def lp_fast(x, cutoff, passes=2):
    # vectorised-ish one-pole via scipy-free FIR approximation (moving average)
    n = max(1, int(SR / cutoff / 2))
    k = np.ones(n) / n
    for _ in range(passes):
        x = np.convolve(x, k, mode="same")
    return x


def add(buf, sig, at):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i]


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


# ---------- music ----------
BPM = 100
BEAT = 60 / BPM
BAR = BEAT * 4
# Am  F  C  G   (root midi, chord tones)
PROG = [(57, [57, 60, 64, 67]), (53, [53, 57, 60, 64]), (48, [55, 60, 64, 67]), (55, [55, 59, 62, 67])]


def kick():
    t = t_arr(0.35)
    f = 48 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * 1.0


def clap():
    t = t_arr(0.25)
    n = rng.uniform(-1, 1, len(t))
    n = n - lp_fast(n, 900)  # crude high-pass
    env = np.exp(-t * 22) + 0.6 * np.exp(-((t - 0.012) * 300) ** 2)
    return n * env * 0.45


def hat(open_=False):
    t = t_arr(0.18 if open_ else 0.06)
    n = rng.uniform(-1, 1, len(t))
    n = n - lp_fast(n, 4000, 1)
    return n * np.exp(-t * (18 if open_ else 70)) * 0.18


def pluck(freq, dur=0.5):
    t = t_arr(dur)
    s = sum(np.sin(2 * np.pi * freq * h * t) * (0.6 ** (h - 1)) for h in range(1, 5))
    return s * np.exp(-t * 7) * 0.22


def pad(freqs, dur):
    t = t_arr(dur)
    s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.12, 0.0, 0.12):
            ff = f * 2 ** (det / 12)
            s += 2 * ((t * ff) % 1) - 1  # saw
    s = lp_fast(s, 1400)
    env = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.4)
    return s * env * 0.035


def bass(freq, dur):
    t = t_arr(dur)
    s = np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t)
    return s * np.minimum(1, t / 0.01) * np.exp(-t * 1.2) * 0.35


def music(D):
    n = int(SR * D)
    drums = np.zeros(n); mel = np.zeros(n); pads = np.zeros(n); bas = np.zeros(n)
    nbars = int(np.ceil(D / BAR)) + 1
    for b in range(nbars):
        root, chord = PROG[b % 4]
        t0 = b * BAR
        add(pads, pad([midi(x) for x in chord[:3]], BAR + 0.3), t0)
        for beat in range(4):
            tb = t0 + beat * BEAT
            add(bas, bass(midi(root - 12), BEAT * 0.95), tb)
            if tb > 0.05:  # leave hook clean for the first hit
                add(drums, kick(), tb)
            if beat in (1, 3):
                add(drums, clap(), tb)
            add(drums, hat(), tb + BEAT / 2)
            if beat == 3:
                add(drums, hat(True), tb + BEAT * 0.75)
        # arpeggio 8ths
        arp = chord + [chord[1] + 12, chord[2] + 12, chord[1] + 12, chord[3]]
        for k in range(8):
            add(mel, pluck(midi(arp[k % len(arp)] + 12)), t0 + k * BEAT / 2)
    # sidechain: duck pads/mel on each beat
    t = t_arr(D)
    phase = (t % BEAT) / BEAT
    duck = 0.45 + 0.55 * np.minimum(1, phase / 0.35)
    mix = drums * 0.9 + (mel * 0.8 + pads) * duck + bas * duck
    return mix


# ---------- sfx ----------
def whoosh(dur=0.55, up=True):
    t = t_arr(dur)
    n = rng.uniform(-1, 1, len(t))
    # sweep a band by mixing two lowpasses with time-varying weight
    lo = lp_fast(n, 600); hi = lp_fast(n, 5000, 1)
    w = t / dur if up else 1 - t / dur
    s = lo * (1 - w) + hi * w
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return s * env * 0.9


def pop(freq=900):
    t = t_arr(0.12)
    f = freq * (1 + 1.2 * np.exp(-t * 60))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 35) * 0.35


def tick():
    t = t_arr(0.05)
    return np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 120) * 0.25


def riser(dur=1.0):
    t = t_arr(dur)
    f = 300 + 1500 * (t / dur) ** 2
    ph = 2 * np.pi * np.cumsum(f) / SR
    n = lp_fast(rng.uniform(-1, 1, len(t)), 3000, 1)
    env = (t / dur) ** 2
    return (np.sin(ph) * 0.25 + n * 0.5) * env * 0.5


def ding():
    t = t_arr(1.2)
    s = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(1318.5, 1), (1975.5, 0.5), (2637, 0.25)])
    return s * np.exp(-t * 4) * 0.22


def impact():
    t = t_arr(0.6)
    f = 40 + 60 * np.exp(-t * 10)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 6) * 0.8


def build(item):
    D = item["duration"]
    T = {"fact": 2.8, "detail": 9.8, "cta": 14.4}
    sfx = np.zeros(int(SR * D))
    # hook: impact + pops for lines + marker swipe
    add(sfx, impact(), 0.0)
    nlines = item["hook"].count("<br>") + 1
    for k in range(nlines):
        add(sfx, pop(700 + 120 * k), 0.1 + k * 0.18)
    add(sfx, whoosh(0.35), 0.7)
    # scene wipes (centered on boundary, wipe lasts 0.7s)
    for b in T.values():
        add(sfx, whoosh(0.7), b - 0.38)
    # fact: icon/big pop + soft ticks for words (every 3rd word)
    add(sfx, pop(1100), T["fact"] + 0.05)
    words = len(item["fact"].split())
    per = min(0.2, 4 / max(words, 1))
    for k in range(0, words, 3):
        add(sfx, tick(), T["fact"] + 0.6 + k * per)
    # detail rows
    rows = [r for r in item["detail"].split("<br>") if r.strip()]
    for k, r in enumerate(rows):
        add(sfx, pop(1300 if r.strip().startswith("✅") else 800), T["detail"] + 0.25 + k * 0.45)
    # cta
    add(sfx, riser(1.0), T["cta"] - 1.0)
    add(sfx, ding(), T["cta"] + 0.05)
    add(sfx, pop(1500), T["cta"] + 0.45)

    m = music(D)[: len(sfx)]
    # duck music under transitions
    t = t_arr(D)
    duck = np.ones_like(t)
    for b in T.values():
        duck -= 0.35 * np.exp(-((t - b) / 0.25) ** 2)
    mix = m * duck * 0.55 + sfx
    fade = np.minimum(1, t / 0.05) * np.minimum(1, (D - t) / 0.8)
    mix *= fade
    mix = np.tanh(mix * 1.4) / np.tanh(1.4)  # soft limiter
    mix = mix / (np.abs(mix).max() + 1e-9) * 0.89
    st = np.stack([mix, np.roll(mix, 120) * 0.98], 1)
    return st


def write(path, st):
    w = wave.open(path, "wb")
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())
    w.close()


if __name__ == "__main__":
    items = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    only = sys.argv[3] if len(sys.argv) > 3 else None
    for it in items:
        if only and it["id"] != only:
            continue
        write(os.path.join(out, f"audio_{it['id']}.wav"), build(it))
        print("audio", it["id"])

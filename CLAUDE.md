# Taras daily TikTok pipeline (ترس @taras_saudi)

Every run produces **5 new videos for the NEXT day** (Asia/Riyadh) and schedules them on TikTok through Metricool.

## Steps
1. Fonts: the template uses Thmanyah Serif Text from `engine/fonts/` (thmanyah-black.otf, thmanyah-bold.otf, thmanyah-medium.otf). These files are NOT in git (licence). If they are missing, STOP and report it — do not render with a fallback font.
   `cd engine && npm install` (fonts only — REQUIRED, without it the Arabic font silently falls back and the video looks broken). Playwright + Chromium are preinstalled — do not install them.
2. Pick the topic: next item in `engine/topics.json` → `rotation` after the last `history` entry's topic (wrap around).
   Read all past `titles` for that topic in `history` and do NOT repeat an idea.
3. Write `engine/content-YYYY-MM-DD.json` (date = the publish day) — an array of 5 items with the exact shape of `engine/content-2026-11-12.json`:
   - `id` "01".."05", `tag` "<topic> | n/5", `palette` 3 hex colours (vary per video), `duration` 17
   - Typography is line-based: every `<br>` is a hard line and each line is auto-sized to fill the width, so WRITE SHORT LINES.
   - `hook` exactly 2 lines: line 1 = 1–2 words (shown huge with amber marker), line 2 = 2–4 words + 1 emoji
   - `emoji` one emoji, `big` short number/word or "" (keep ≤ 10 chars)
   - `fact` 2–3 lines separated by `<br>`, 2–4 words per line; wrap highlighted words in `*...*`; no other HTML.
     Keep Latin text (file names, English words) as ONE token without spaces (e.g. `*cv_final2.pdf*`) or it renders in the wrong order
   - `detail` 2–3 lines separated by `<br>`; each line is shown as its own row in a white card, so every line must be a complete standalone point (never split one sentence across lines). Start a line with ✅ or ❌ to get a green check / orange cross icon; a line ending in `:` becomes the card heading. Use `<b>` for emphasis
   - `palette` is ignored by the current brand template (keep it for compatibility)
   - `cta` 2 short lines (follow / save / comment / share; the 5th video teases tomorrow's topic)
   - `caption` ≤ 150 chars, 1 line + 5–6 hashtags incl. #وظائف #توظيف #اكسبلور
   Content rules: Saudi dialect, practical job-search advice for the Saudi/Gulf market. Only state facts you are sure of;
   prefer actionable advice over statistics. Never invent numbers, company names or quotes.
4. Audio then render:
   `python3 engine/audio.py engine/content-YYYY-MM-DD.json videos/YYYY-MM-DD` (music + SFX synced to the template timeline, writes audio_NN.wav)
   `PREVIEW=1 node engine/render.js engine/content-YYYY-MM-DD.json videos/YYYY-MM-DD` (≈2 min/video; picks up audio_NN.wav automatically).
   Delete the audio_NN.wav files before committing (keep only the mp4s).
   Quick stills: `node engine/preview.js engine/content-YYYY-MM-DD.json /tmp/prev` makes one contact sheet per video. Open the preview PNGs and check text fits, nothing overflows/overlaps, Arabic shapes correctly. Fix the JSON and re-render any bad video.
   Delete the PNGs before committing.
5. Append the day to `history` in `engine/topics.json`, commit, and push to `main`
   (git user `Kroom188 <Kroom188@users.noreply.github.com>`).
6. Get the pushed commit SHA and schedule each video with Metricool `createScheduledPost`:
   - blogId `8060728`, network `tiktok`, timezone `Asia/Riyadh`
   - slots: 01→10:00, 02→12:00, 03→16:00, 04→18:00, 05→20:00 on the publish day
   - media: `https://raw.githubusercontent.com/Kroom188/taras-videos/<SHA>/videos/YYYY-MM-DD/video_NN.mp4`
     (use the SHA, not `main` — the branch URL is CDN-cached)
   - text = caption; `tiktokData`: `title` = hook without `<br>`/emoji (required), `isAigc: true`,
     `autoAddMusic: false` (not allowed for videos — music is already baked in), `privacyOption: PUBLIC_TO_EVERYONE`
   - Before scheduling, call `getScheduledPosts` for that day and skip slots that already have a post (avoid duplicates on re-runs).
7. Finish with a one-paragraph summary in Arabic: topic, the 5 titles, scheduled times.

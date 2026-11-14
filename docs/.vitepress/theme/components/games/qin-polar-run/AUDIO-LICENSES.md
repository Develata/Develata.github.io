# Northern Run audio provenance

- Title: **Chilly Oriental Feeling With Laser Shots C64 Style**
- Author: **skrjablin**
- Source platform: OpenGameArt
- Source page: https://opengameart.org/content/chilly-oriental-feeling-with-laser-shots-c64-style
- Original download: https://opengameart.org/sites/default/files/chilly_oriental_feeling_with_laser_shots_c64_style_0.mp3
- License selected: **CC0 1.0** (https://creativecommons.org/publicdomain/zero/1.0/). The source page lists CC0 alongside CC-BY 3.0; this derivative uses its CC0 option.
- Verified and retrieved: **2026-09-07**, before processing the download. The source describes it as loopable C64/SID music made with Goat Tracker.
- Original filename: chilly_oriental_feeling_with_laser_shots_c64_style_0.mp3
- Original media: MP3, 736,209 bytes, 45.94s, mono, 44,100Hz, approximately 128kbps. Original remains outside the repository.
- Final deployed filename: docs/public/game-assets/qin-polar-run/audio/northern-run-bgm.mp3
- Final media: MP3, **92,386 bytes**, **22.98s**, **mono**, **22,050Hz**, **32kbps**.

## One-time local processing

FFmpeg was already installed on the Windows host. No FFmpeg executable or CI processing step is committed.
The repeating envelope has its strongest 20–30s-lag match at 22.98s (correlation approximately 0.963).
We keep the first 23 seconds, apply a 6,500Hz low-pass and gain 1.6, then fold a 20ms
linear crossfade from the tail into the opening 20ms. This produces a 22.98s circular
segment without a deliberate silence gap. MP3 gapless/Xing metadata is retained.
Decoded peak amplitude is 0.538 (no clipping); decoded endpoint delta is 0.01094.
These are signal checks, not a claim of human listening on every device.

Processing filter (followed by libmp3lame, -ac 1 -ar 22050 -b:a 32k -map_metadata -1 -write_xing 1):

```text
[0:a]aresample=22050,lowpass=f=6500,volume=1.6,asplit=2[a][b];
[a]atrim=start=0.02:end=23.0,asetpts=PTS-STARTPTS[body];
[b]atrim=start=0:end=0.02,asetpts=PTS-STARTPTS[head];
[body][head]acrossfade=d=0.02:c1=tri:c2=tri[out]
```

Runtime uses one lazy HTMLAudioElement, volume 0.4, fixed playbackRate 1, and a page-session mute switch.
No original Funkytown file, 画离弦, or derivative of either was read, committed, or deployed for this task.

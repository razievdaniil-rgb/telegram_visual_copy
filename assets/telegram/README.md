# Telegram iOS UI Kit assets

Local assets from the user-supplied community kit, imported as Figma file `hYJ3EmdVKaiQyuZ2k7z01J`. Downloaded 2026-10-23. No temporary download URLs are used at runtime. Original SVG exports are unmodified.

## Original icon font

The kit's Getting Started page links to [iostgico.ttf](https://drive.google.com/file/d/1-EpFABQ28ZhqkSbmrMSCK9QUJi1rIDDk/view). The original is preserved as `iostgico.ttf` (708420 bytes), SHA-256 `a6d1332335ea813dae42d676a0722822c54c5fe632f5b16fa40f1fdfffcc2f2e`.

Its COLR table hard-codes blue, overriding the Text foreground color. Runtime uses `iostgico-monochrome.ttf`: all 1053 COLR layer palette indexes are set to OpenType's foreground-color index 0xFFFF. Outlines, metrics and character mappings are preserved. Reproduce with `python scripts/prepare-kit-font.py` after installing `fonttools==4.67.0`. The source font is never overwritten.

`src/kit-symbol.tsx` records the exact codepoints from the five full Figma contexts. All 36 distinct mapped glyphs were verified present. The font is bundled and loaded before public UI mounts. Native SF Symbols cover system chevrons, search and close; exported SVGs cover their cross-platform fallbacks. Avatars remain user data.

## SVG source map

| File             | Source node                                  | Dimensions      |
| ---------------- | -------------------------------------------- | --------------- |
| back.svg         | 6398:9041                                    | 28×28           |
| calls.svg        | 6398:8818                                    | 28×28           |
| chats.svg        | 6398:8816                                    | 28×28           |
| settings.svg     | 6398:8968                                    | 28×28           |
| compose.svg      | 6398:8972                                    | 28×28           |
| contacts.svg     | 6398:8854                                    | 28×28           |
| more.svg         | 6398:9019                                    | 28×28           |
| plus.svg         | 6398:8973                                    | 28×28           |
| search.svg       | 6398:8852                                    | 28×28           |
| story.svg        | 6398:8636                                    | 28×28           |
| video.svg        | 6398:8682                                    | 28×28           |
| smile.svg        | 6406:124                                     | 28×28           |
| voice.svg        | 6398:8966                                    | 28×28           |
| send.svg         | 6398:9048                                    | 28×28           |
| mute.svg         | 6398:8635                                    | 28×28           |
| qr.svg           | 6398:8571                                    | 28×28           |
| patterns.svg     | I6973:36423;6020:6762                        | 507×873         |
| incomingTail.svg | I6973:36838;6780:15575;6772:31439;6769:10450 | 13.6211×32      |
| outgoingTail.svg | I6973:36435;6780:15575;6786:8287;6769:10207  | 13.6211×32      |
| read.svg         | Chats — With Tabs / Read Status              | 17.4991×10.0485 |

`mic.svg` (6398:9021) represents a muted call microphone and is retained only as a source record; it is not registered or rendered. Runtime composer uses the correct F282 font glyph. The earlier incorrect compose export has been replaced with the actual new-note icon above.

Profile/settings decoration exports have native sizes 24, 20, 18 and 16; `*-imgIcons.svg` masks are 476×379. Exact placements are in `src/profile-pattern.tsx`, based on `I6802:22955;6800:21913` and `I6802:5689;6800:22188`. Hardware bezels, example media and premium decorations are not embedded in the app.

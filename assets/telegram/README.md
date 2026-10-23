# Telegram iOS UI Kit assets

Original, unmodified SVG exports from the user-supplied community kit, imported as Figma file `hYJ3EmdVKaiQyuZ2k7z01J`. Downloaded 2026-10-23. No temporary asset URLs are used at runtime.

| File             | Source node                                  | Native dimensions |
| ---------------- | -------------------------------------------- | ----------------- |
| back.svg         | 6398:9041                                    | 28×28             |
| calls.svg        | 6398:8818                                    | 28×28             |
| compose.svg      | 6398:8801                                    | 28×28             |
| contacts.svg     | 6398:8854                                    | 28×28             |
| mic.svg          | 6398:9021                                    | 28×28             |
| more.svg         | 6398:9019                                    | 28×28             |
| plus.svg         | 6398:8973                                    | 28×28             |
| search.svg       | 6398:8852                                    | 28×28             |
| story.svg        | 6398:8636                                    | 28×28             |
| video.svg        | 6398:8682                                    | 28×28             |
| patterns.svg     | I6973:36423;6020:6762                        | 507×873           |
| incomingTail.svg | I6973:36838;6780:15575;6772:31439;6769:10450 | 13.6211×32        |
| outgoingTail.svg | I6973:36435;6780:15575;6786:8287;6769:10207  | 13.6211×32        |
| read.svg         | Chats — With Tabs / Read Status              | 17.4991×10.0485   |

The exports named `compose.svg` and `mic.svg` were rejected during visual QA: those source nodes represent adjustment sliders and a muted call microphone. They are kept only as source records and are not registered in `kitAssets` or rendered. The correct compose and voice-message glyphs still need exporting.

Profile/settings decoration assets are exported at native sizes 24, 20, 18 and 16; their respective `*-imgIcons.svg` masks are 476×379. Exact placements and mask offsets are recorded in `src/profile-pattern.tsx`, based on `I6802:22955;6800:21913` and `I6802:5689;6800:22188`.

Figma Starter MCP quota interrupted exports for chats/settings tab icons, emoji, send and mute. Existing Ionicons for those slots remain provisional; they are not exact exported kit assets. Attachment/QR/settings row glyphs also need original exports. Do not mark visual acceptance complete until these have been replaced and compared. Avatars remain user data, not static kit examples. The kit contains premium decorations, channel/music/media content and hardware bezels outside the agreed text simulator scope; these are not embedded in the UI.

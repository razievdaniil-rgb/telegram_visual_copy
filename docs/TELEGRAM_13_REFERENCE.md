# Telegram iOS 13.1.1 — source reference

The selected target is Telegram iOS **13.1.1**, as confirmed by the user on 23 October 2026. The older 12.6.1 Figma kit is historical; it no longer determines conflicting geometry or colors.

Source: https://github.com/TelegramMessenger/Telegram-iOS/tree/fb0e62ba8a147f0821da6aa63c09da7d79a10111

## Measured source values

| Element             | Source                                                                                                                            | Values used                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Light Classic theme | `TelegramPresentationData/Sources/DefaultDayPresentationTheme.swift`                                                              | accent #0088FF, grouped #EFEFF4, secondary #8E8E93, outgoing #E1FFC7, check #19C700             |
| Chat row            | `ChatListUI/Sources/Node/ChatListItem.swift`                                                                                      | avatar 60 at x16; title x86, 16 semibold; preview 15; date 14; unread minimum 20; separator x84 |
| Navigation controls | `ChatListUI/Sources/ChatListNavigationBar.swift`                                                                                  | 44 high, 10 below system safe area                                                              |
| Tabs                | `TelegramUI/Components/TabBarComponent` and `TabBarLayout`                                                                        | bar 64, item 56, padding 4, icons 48 with -4 offset, label 10 semibold, search 64, gap 8        |
| Search              | `TabBarComponent/NavigationSearchView`                                                                                            | bottom field 48; close 48; gap 8                                                                |
| Bubble              | `TelegramPresentationData/Sources/ChatMessageBubbleImages.swift`, `TelegramUIPreferences/Sources/PresentationThemeSettings.swift` | main corners 16, joined corners 8, original tail mask mirrored for incoming                     |
| Grouping            | `ChatMessageMergeFingerprint.swift`                                                                                               | same side and date, timestamp difference below 10 minutes                                       |
| Text bubble padding | `TelegramUI/Components/Chat/ChatMessageItemCommon`                                                                                | 11 horizontal + 6 tail allowance, 6±pixel vertical, max width screen minus 36                   |
| Input               | `TelegramUI/Components/Chat/ChatTextInputPanelNode`                                                                               | attachment 40, field minimum 40, text 17, sticker 24, microphone/send inside capsule            |
| Title               | `TelegramUI/Components/Chat/ChatTitleView`                                                                                        | name 17 semibold, status 13 regular                                                             |
| Profile             | `TelegramUI/Components/PeerInfo/PeerInfoScreen`                                                                                   | avatar 100 at y22 after safe area, title 28 medium, status 17; actions 58, radius 16, gap 8     |
| Settings row        | `PeerInfoScreenDisclosureItem`                                                                                                    | row 52, icon 29, gap 16, side 16                                                                |

Chat row height 68 is derived from upstream TextNode layout with the default 16pt font. Native font rounding and large text still need screenshot verification. No fake system clock, connection icons or keyboard are drawn by the application.

## Local resources and reproducibility

`assets/telegram-ios/original/` preserves upstream PDF and Lottie inputs. Exported icons retain source paths; tint is applied by the app. Tabs currently use the last frame of the upstream Lottie animation. Original input icons are PNGs from the same asset catalog. Canonical filenames omit the @3x suffix; pixels remain at 3x and the component sets the original point size explicitly. Settings icons are rendered using source colors, Gradient/Backdrop layers and white icon masks.

Scripts:

- `scripts/telegram-vector-assets.py` — PyMuPDF 1.26.7 and python-lottie 0.7.2, PDF to SVG and final Lottie frames.
- `scripts/telegram-settings-assets.py` — PyMuPDF and Pillow, original settings contours and composites at 3x.
- `scripts/telegram-gradient.py` — Pillow, phase 0 of SoftwareGradientBackground.swift (36×80 for 402pt portrait).

Reference checkout expected at `artifacts/telegram-ios-source`. Scripts do not run during application builds. All runtime resources are local. Upstream attribution and exact source paths are also recorded in `assets/telegram-ios/NOTICE.md`.

## Remaining visual differences / verification

- No 13.1.1 screenshot golden set is present. Matching source values is not a passed pixel comparison.
- Native iOS uses the system San Francisco font and native GlassView on iOS 26+. Android/web use system fallbacks; identical native glass is not claimed there.
- The wallpaper currently uses the **bundled 155×320 pattern thumbnail** from upstream resource 5789658100176783156-m.resource, not the full-resolution remotely fetched pattern. This must be replaced before claiming full wallpaper fidelity. Static gradient phase is used; animated phase transitions are not implemented.
- Tab icons show the exact exported end frame, without original Lottie transitions. Selected lens is static between tabs.
- Avatar initials use system bold rather than a custom native rounded font; user-selected avatar colors remain intact.
- Calls uses CallListControllerNode geometry (148pt illustration, 13pt image-to-text gap, 16pt caption, 23pt button gap), original CallsPlaceholder frame 20 and CallIcon. The loop is static; Russian placeholder copy is not checked against a 13.1.1 device screenshot. No actual calling.
- Device keyboard, accessibility text enlargement, glass and profile geometry need native visual review. `.github/workflows/visual-ios.yml` builds a fixture-enabled Simulator app and captures six screens. Fixture seeding only runs with EXPO_PUBLIC_VISUAL_TEST=1 and empty storage.

The old f6c286a APK/IPA do not include this 13.1.1 pass.

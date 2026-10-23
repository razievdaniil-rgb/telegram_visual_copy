# Upstream resources

Source: TelegramMessenger/Telegram-iOS, version 13.1.1.
Pinned commit: fb0e62ba8a147f0821da6aa63c09da7d79a10111.
https://github.com/TelegramMessenger/Telegram-iOS/tree/fb0e62ba8a147f0821da6aa63c09da7d79a10111

Original files retain their upstream names/content in original/. They are not authored by ChatStudio.

- Tab*.json: submodules/TelegramUI/Resources/Animations. SVGs are final animation frames.
- compose: Images.xcassets/Chat List/ComposeIcon.imageset/ic_create.pdf.
- send: Images.xcassets/Chat/Input/Text/SendIcon.imageset/send.pdf.
- profile-_: Images.xcassets/Peer Info/Button_.imageset.
- attachment, microphone, sticker: Images.xcassets/Chat/Input/Text; PNG pixel data copied unchanged.
- settings-*: Images.xcassets/Item List/Icons and PresentationResourcesSettings.swift. PNGs rendered at 3x with the source masks and background layers.
- photo, qr: Images.xcassets/Settings/SetAvatar and QrButtonIcon.
- plus: Images.xcassets/Item List/Icons/Add.
- original/wallpaper-preview.png: unchanged submodules/TelegramUI/Resources/5789658100176783156-m.resource (155x320).
- original/wallpaper-full-web.svg: morethanwords/tweb public/assets/img/pattern.svg, last changed at 9b50ea6901a11ff734fd65936a0e4bc2fa4c750b. Source: https://github.com/morethanwords/tweb/blob/9b50ea6901a11ff734fd65936a0e4bc2fa4c750b/public/assets/img/pattern.svg . GPL-3.0 text retained in original/LICENSE-tweb.txt.
- wallpaper-pattern.png: 1550x3200 raster of that vector, cropped to the central third and mapped to the iOS preview aspect. The crop matches the bundled preview (217 spatially distributed SIFT inliers, alpha correlation 0.9542). No shapes were redrawn. This does not substitute for a device screenshot comparison of the final wallpaper scale.
- wallpaper-gradient.png: port of SoftwareGradientBackground.swift phase 0, default Classic colors.

Geometric ports in src/message-bubble.tsx and src/message-ui.tsx derive from ChatMessageBubbleImages.swift and PresentationThemeEssentialGraphics.swift respectively. Changes and limitations: docs/TELEGRAM_13_REFERENCE.md. Telegram's upstream README asks derivative applications to publish their source and identify themselves as unofficial; ChatStudio retains its own application identity, an About disclosure, and its public source repository.

- disclosure: Images.xcassets/Item List/DisclosureArrow.imageset/ic_open.pdf.
- add: Images.xcassets/Chat List/AddIcon.imageset/ic_add.pdf.
- invite: Images.xcassets/Contact List/InviteActionIcon.imageset/ic_heart.pdf.

Contacts SVG compounds nested subpaths into one nonzero-fill path after export, preserving the original silhouette cutout.

- calls-placeholder.svg: frame 20 of Resources/Animations/CallsPlaceholder.tgs; original loop retained in original/.
- new-call: Images.xcassets/Call List/CallIcon.imageset/phoneplus_24.pdf.

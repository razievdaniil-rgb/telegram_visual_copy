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
- wallpaper-pattern.png: original submodules/TelegramUI/Resources/5789658100176783156-m.resource (bundled thumbnail).
- wallpaper-gradient.png: port of SoftwareGradientBackground.swift phase 0, default Classic colors.

Geometric ports in src/message-bubble.tsx and src/message-ui.tsx derive from ChatMessageBubbleImages.swift and PresentationThemeEssentialGraphics.swift respectively. Changes and limitations: docs/TELEGRAM_13_REFERENCE.md. Telegram's upstream README asks derivative applications to publish their source and identify themselves as unofficial; ChatStudio retains its own application identity, an About disclosure, and its public source repository.

- disclosure: Images.xcassets/Item List/DisclosureArrow.imageset/ic_open.pdf.
- add: Images.xcassets/Chat List/AddIcon.imageset/ic_add.pdf.
- invite: Images.xcassets/Contact List/InviteActionIcon.imageset/ic_heart.pdf.

Contacts SVG compounds nested subpaths into one nonzero-fill path after export, preserving the original silhouette cutout.

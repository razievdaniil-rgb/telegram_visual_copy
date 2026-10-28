# Local wallpaper resources

SimulatorDefaultPattern.tgv and fqv01SQemVIBAAAApND8LDRUhRU.tgv are unchanged copies of Telegram iOS 13.1.1 submodules/TelegramUI/Resources/fqv01SQemVIBAAAApND8LDRUhRU.tgv at fb0e62ba. Git blob a106f042d62c833e8f096d2877c490eb156d1169, SHA256 3c5ef666d033ce9effe703b80348b9d7363323f0076b2856ec041923c78b0ab8, 183832 bytes. The original full SVG viewport is preserved. Rendering, color blending and gradient animation remain Telegram iOS code.

SimulatorDefaultPatternPreview.png is the unchanged Telegram iOS 13.1.1 resource 5789658100176783156-m.resource (source pin fb0e62ba). See assets/telegram-ios/NOTICE.md for attribution.

The full TGV exists in the complete iOS source checkout; its absence in an earlier sparse checkout was misidentified. Resources are supplied under the default wallpaper's native identifiers and canonical filename; no Telegram connection is required.

SimulatorDefaultPattern.bin is a prepared vector command stream, not a bitmap. native/scripts/check_pattern.c uses the pinned upstream NanoSVG parser and the filled-template command format from Svg.m CGContextCoder/processShape. It is reproduced by the Native Swift sources workflow and consumed unchanged by the original iOS renderer. The raw TGV is also supplied under the canonical fqv01SQemVIBAAAApND8LDRUhRU.tgv filename used by TelegramAccountAuxiliaryMethods.

LICENSE-tweb.txt documents the historical Web prototype resource; the native wallpaper now uses the original iOS asset above.

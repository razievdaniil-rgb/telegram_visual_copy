# Local wallpaper resources

SimulatorDefaultPattern.tgv contains gzip-compressed original Telegram Web vectors from morethanwords/tweb, commit 9b50ea6901a11ff734fd65936a0e4bc2fa4c750b, public/assets/img/pattern.svg. Source and GPL-3.0 license: assets/telegram-ios/original/wallpaper-full-web.svg and LICENSE-tweb.txt. The SVG viewport is the central third registered against the original Telegram iOS 155x320 preview; no shapes were redrawn. Rendering, color blending and gradient animation remain Telegram iOS code. Final native scale must be reviewed from simulator frames.

SimulatorDefaultPatternPreview.png is the unchanged Telegram iOS 13.1.1 resource 5789658100176783156-m.resource (source pin fb0e62ba). See assets/telegram-ios/NOTICE.md for attribution.

The full cloud pattern is absent from the iOS source checkout. Both bundled files are installed into the local media box under the default wallpaper's native resource identifiers; no Telegram connection is required.

SimulatorDefaultPattern.bin is a prepared vector command stream, not a bitmap. native/scripts/check_pattern.c uses the pinned upstream NanoSVG parser and the filled-template command format from Svg.m CGContextCoder/processShape. It is reproduced by the Native Swift sources workflow and consumed unchanged by the original iOS renderer. The raw TGV is also supplied under the canonical fqv01SQemVIBAAAApND8LDRUhRU.tgv filename used by TelegramAccountAuxiliaryMethods.

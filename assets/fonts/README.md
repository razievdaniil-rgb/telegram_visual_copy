# Cross-platform text

Inter 4.1 static Regular, Medium, SemiBold and Bold faces are unmodified files
from https://github.com/rsms/inter/releases/tag/v4.1 (`extras/ttf/`).
Copyright and redistribution terms are included in `OFL-Inter.txt`.

iOS continues to use UIKit's system font, as Telegram-iOS does. Android and web
load these local assets before showing the app; they no longer depend on Roboto,
Arial or fonts installed on the user's computer. Inter supports Cyrillic but is
an approximation of the iOS typography, not a copy of SF Pro. No Apple font is
redistributed. `src/text.tsx` selects real static weights for both rendered text
and the hidden line-measurement probes.

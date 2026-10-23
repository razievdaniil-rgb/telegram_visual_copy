"""Create a theme-colored copy of the kit font (requires fonttools==4.67.0).

Original COLR layers hard-code blue. The OpenType foreground-color index
0xFFFF preserves every outline while letting React Native's Text color apply.
The original source font is never overwritten.
"""

from pathlib import Path
import re
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
source = root / "assets/telegram/iostgico.ttf"
destination = root / "assets/telegram/iostgico-monochrome.ttf"
font = TTFont(source, recalcTimestamp=False)
assert font["COLR"].version == 0
symbol_source = (root / "src/kit-symbol.tsx").read_text(encoding="utf-8")
codepoints = {int(value, 16) for value in re.findall(r"\\u([0-9A-F]{4})", symbol_source)}
cmap = font.getBestCmap()
# Every used glyph is opaque blue. A future translucent glyph needs a different
# conversion that preserves per-layer alpha instead of flattening its palette.
assert all(codepoint in cmap for codepoint in codepoints)
assert all(
    layer.colorID == 0
    for codepoint in codepoints
    for layer in font["COLR"].ColorLayers.get(cmap[codepoint], [])
)
layers = 0
for glyph_layers in font["COLR"].ColorLayers.values():
    for layer in glyph_layers:
        layer.colorID = 0xFFFF
        layers += 1
font.save(destination)
copy = TTFont(destination)
assert copy.getBestCmap() == font.getBestCmap()
assert copy["hmtx"].metrics == font["hmtx"].metrics
assert copy.getTableData("glyf") == font.getTableData("glyf")
assert all(layer.colorID == 0xFFFF for group in copy["COLR"].ColorLayers.values() for layer in group)
print(f"Preserved {layers} COLR layers; wrote {destination.name}")

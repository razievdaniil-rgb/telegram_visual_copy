"""Render the pinned Telegram Web vector in the iOS preview's coordinate crop.

Source vector: morethanwords/tweb, 9b50ea6901a11ff734fd65936a0e4bc2fa4c750b.
The iOS bundled 155x320 preview matches the center third of the 1440x2960 SVG.
Registration was checked across the image (217 SIFT inliers; alpha r=0.9542).
This retains that reference crop, not a claim about an unseen device golden.
Requires PyMuPDF 1.26.7 and Pillow; no runtime or network dependency.
"""
from pathlib import Path
import fitz
from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = root / 'assets/telegram-ios'
page = fitz.open(assets / 'original/wallpaper-full-web.svg')[0]
assert page.rect.width == 1440 and page.rect.height == 2960
crop = fitz.Rect(480, 2960 / 3, 960, 2960 * 2 / 3)
size = (1550, 3200)
pix = page.get_pixmap(matrix=fitz.Matrix(size[0]/crop.width, size[1]/crop.height), clip=crop, alpha=True)
rgba = Image.frombytes('RGBA', (pix.width, pix.height), pix.samples)
if rgba.size != size:
    rgba = rgba.resize(size, Image.Resampling.LANCZOS)
mask = Image.new('RGBA', size, (0, 0, 0, 0))
mask.putalpha(rgba.getchannel('A'))
temporary = assets / 'wallpaper-pattern.next.png'
mask.save(temporary, optimize=True)
temporary.replace(assets / 'wallpaper-pattern.png')
print('Pattern exported:', size)

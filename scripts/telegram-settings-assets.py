from pathlib import Path
import fitz, shutil, json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'artifacts/telegram-ios-source/submodules/TelegramUI/Images.xcassets'
OUT=ROOT/'assets/telegram-ios'
N=90

def image(path):
    if path.suffix=='.pdf':
        doc=fitz.open(path); pix=doc[0].get_pixmap(matrix=fitz.Matrix(3,3),alpha=True)
        # fitz supplies premultiplied RGB; masks use alpha only.
        return Image.frombytes('RGBA',(pix.width,pix.height),pix.samples)
    return Image.open(path).convert('RGBA')
def asset(folder):
    directory=SOURCE/f'{folder}.imageset'
    entries=json.loads((directory/'Contents.json').read_text())['images']
    entry=next((e for e in entries if e.get('scale')=='3x' and e.get('filename')),next(e for e in entries if e.get('filename')))
    path=directory/entry['filename']
    dest=OUT/'original'/path.name
    shutil.copyfile(path,dest)
    return image(path)
gradient=asset('Item List/Icons/Gradient').resize((N,N))
backdrop=asset('Item List/Icons/Backdrop').resize((N,N))
items={
 'profile':('Profile',['FF453A']), 'saved':('SavedMessages',['0A84FF']),
 'recentCalls':('Phone',['34C759']), 'devices':('Devices',['FF9F0A']),
 'folders':('Folder',['32ADE6']), 'notifications':('Notifications',['FF453A']),
 'privacy':('Privacy',['8E8E93']), 'data':('Data',['34C759']),
 'appearance':('Appearance',['32ADE6']), 'power':('PowerSaving',['FF9F0A']),
 'language':('Language',['AF52DE']), 'premium':('Premium',['6B93FF','6B93FF','8D77FF','B56EEC','B56EEC']),
 'stars':('Stars',['FEC80F','DD6F12']), 'business':('Business',['A95CE3','F16B80']),
 'gift':('Gift',['3BA1F2','3BA1F2','39B3B4','34C27D','34C27D']),
 'question':('Support',['FF9F0A']), 'faq':('Faq',['32ADE6']), 'features':('Tips',['FFCC02']),
}
for name,(icon,hexes) in items.items():
    mask=asset(f'Item List/Icons/{icon}')
    canvas=Image.new('RGBA',(N,N))
    cols=[tuple(int(h[i:i+2],16)/255 for i in (0,2,4)) for h in hexes]
    stops=[0,.15,.5,.85,1] if len(cols)==5 else ([0,1] if len(cols)==2 else [0])
    for y in range(N):
        for x in range(N):
            # UIKit gradient direction is bottom-right -> top-left for ordinary icons,
            # top-left -> bottom-right for premium/stars/gift.
            t=(x+y)/(2*(N-1)); t=t if len(cols)>1 and name!='business' else 1-t
            k=next((i for i in range(len(stops)-1) if t<=stops[i+1]),max(0,len(stops)-2))
            f=(t-stops[k])/(stops[k+1]-stops[k]) if len(cols)>1 else 0
            rgb=[cols[k][c]*(1-f)+cols[min(k+1,len(cols)-1)][c]*f for c in range(3)]
            g=gradient.getpixel((x,y)); b=backdrop.getpixel((x,y))
            for c in range(3):
                rgb[c]=min(1,rgb[c]+g[c]/255) # premultiplied plusLighter
                base=rgb[c]; blend=b[c]/255
                ov=2*base*blend if base<.5 else 1-2*(1-base)*(1-blend)
                rgb[c]=base*(1-b[3]/255)+ov*b[3]/255
            canvas.putpixel((x,y),tuple(round(c*255) for c in rgb)+(255,))
    alpha=Image.new('L',(N,N)); alpha.paste(mask.getchannel('A'),((N-mask.width)//2,(N-mask.height)//2))
    canvas=Image.composite(Image.new('RGBA',(N,N),'white'),canvas,alpha)
    # Same 8pt radius as renderSettingsIcon, supersampled edge.
    from PIL import ImageDraw
    clip=Image.new('L',(N*3,N*3));ImageDraw.Draw(clip).rounded_rectangle((0,0,N*3-1,N*3-1),radius=24*3,fill=255)
    canvas.putalpha(clip.resize((N,N),Image.Resampling.LANCZOS))
    canvas.save(OUT/f'settings-{name}.png')
for name,folder in {'qr':'Settings/QrButtonIcon','photo':'Settings/SetAvatar','plus':'Item List/Icons/Add','invite':'Contacts/Invite'}.items():
    try:
        im=asset(folder); im.save(OUT/f'{name}.png')
    except (FileNotFoundError,StopIteration):
        print('Missing optional',folder)
print('Exported',len(items),'settings icons')

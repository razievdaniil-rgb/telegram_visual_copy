from pathlib import Path
from lottie.parsers.tgs import parse_tgs
from lottie.exporters.svg import export_svg
import fitz,shutil
root=Path(__file__).resolve().parents[1]
assets=root/'assets/telegram-ios'
for name in ['TabChats','TabCalls','TabContacts','TabSettings']:
    anim=parse_tgs(str(assets/'original'/f'{name}.json'))
    export_svg(anim,str(assets/f'{name}.svg'),frame=anim.out_point-1)
source=root/'artifacts/telegram-ios-source/submodules/TelegramUI/Images.xcassets'
files={
 'new-call':'Call List/CallIcon.imageset/phoneplus_24.pdf',
 'disclosure':'Item List/DisclosureArrow.imageset/ic_open.pdf',
 'add':'Chat List/AddIcon.imageset/ic_add.pdf',
 'invite':'Contact List/InviteActionIcon.imageset/ic_heart.pdf',
 'compose':'Chat List/ComposeIcon.imageset/ic_create.pdf',
 'send':'Chat/Input/Text/SendIcon.imageset/send.pdf',
 'profile-call':'Peer Info/ButtonCall.imageset/ic_pf_call.pdf',
 'profile-video':'Peer Info/ButtonVideo.imageset/videocamera_30.pdf',
 'profile-search':'Peer Info/ButtonSearch.imageset/ic_search.pdf',
 'profile-mute':'Peer Info/ButtonMute.imageset/ic_pf_mute.pdf',
 'profile-more':'Peer Info/ButtonMore.imageset/ic_pf_more.pdf',
 'profile-message':'Peer Info/ButtonMessage.imageset/ic_pf_message.pdf',
}
for name,path in files.items():
    shutil.copyfile(source/path,assets/'original'/f'{name}.pdf')
    doc=fitz.open(source/path)
    (assets/f'{name}.svg').write_text(doc[0].get_svg_image(),encoding='utf-8')
    print(name,doc[0].rect)
for name,path in {
 'attachment':'Chat/Input/Text/IconAttachment.imageset/ModernConversationAttach@3x.png',
 'sticker':'Chat/Input/Text/AccessoryIconStickers.imageset/ConversationInputFieldStickerIcon@3x.png',
 'microphone':'Chat/Input/Text/IconMicrophone.imageset/ModernConversationMicButton@3x.png',
}.items():
    shutil.copyfile(source/path,assets/f'{name}.png')
print('Original tab frames, profile vectors and input images exported.')


# Lottie applies one nonzero fill to the whole contacts group. The SVG
# exporter splits nested paths, so reunite them to preserve transparent holes.
import re,xml.etree.ElementTree as ET
from pathlib import Path
p=root/'assets/telegram-ios/TabContacts.svg'
tree=ET.parse(p);root=tree.getroot();ns='{http://www.w3.org/2000/svg}'
group=next(n for n in root.iter(ns+'g') if n.attrib.get('id')=='Group_1')
parts=[]
def walk(n,dx=0,dy=0):
 t=n.attrib.get('transform','')
 if t:
  a,b,c,d,e,f=map(float,re.findall(r'-?\d+(?:\.\d+)?',t))
  assert (a,b,c,d)==(1,0,0,1)
  dx+=e;dy+=f
 if n.tag==ns+'path':
  data=n.attrib['d'];assert set(re.findall('[A-Za-z]',data))<={'M','C','Z'}
  i=0
  def shift(m):
   nonlocal i
   v=float(m.group())+(dx if i%2==0 else dy);i+=1
   return f'{v:.6f}'.rstrip('0').rstrip('.') if v else '0'
  parts.append(re.sub(r'-?\d+(?:\.\d+)?',shift,data))
 for child in n:walk(child,dx,dy)
walk(group)
for n in list(group):group.remove(n)
ET.SubElement(group,ns+'path',{'d':' '.join(parts),'fill-rule':'nonzero'})
ET.register_namespace('',ns[1:-1]);tree.write(p,encoding='utf-8',xml_declaration=True)

# Static snapshot of the original CallsPlaceholder loop.
anim=parse_tgs(str(assets/'original/CallsPlaceholder.tgs'))
export_svg(anim,str(assets/'calls-placeholder.svg'),frame=20)

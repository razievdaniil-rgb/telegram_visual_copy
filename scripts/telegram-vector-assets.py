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


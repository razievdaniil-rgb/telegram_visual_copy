from PIL import Image
from math import sqrt,sin,cos
colors=[(0xdb,0xdd,0xbb),(0x6b,0xa5,0x87),(0xd5,0xd8,0x8d),(0x88,0xb8,0x84)]
positions=[(.80,.90),(.35,.75),(.20,.10),(.65,.25)]
w,h=36,80
im=Image.new('RGB',(w,h))
for y in range(h):
 for x in range(w):
  dx,dy=x/w-.5,y/h-.5
  theta=(.35*sqrt(dx*dx+dy*dy))**2*.8*8
  px=max(0,min(1,.5+dx*cos(theta)-dy*sin(theta)))
  py=max(0,min(1,.5+dx*sin(theta)+dy*cos(theta)))
  weights=[max(0,.92-sqrt((px-a)**2+(py-b)**2))**3 for a,b in positions]
  total=max(.00001,sum(weights))
  im.putpixel((x,y),tuple(min(255,int(sum(weights[i]*colors[i][c]/255 for i in range(4))/total*255)) for c in range(3)))
im.save('assets/telegram-ios/wallpaper-gradient.png')

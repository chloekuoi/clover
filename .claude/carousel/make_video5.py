#!/usr/bin/env python3
import pathlib, subprocess, shutil
from PIL import Image, ImageDraw
import numpy as np

HERE = pathlib.Path(__file__).parent
GROUND = (243,239,255)

# chrome overlay with transparent hole
key = Image.open(HERE/'keyout/clover_slide5.png').convert('RGBA')
arr = np.array(key); mag=(arr[:,:,0]>200)&(arr[:,:,1]<80)&(arr[:,:,2]>200)
arr[mag,3]=0; chrome=Image.fromarray(arr,'RGBA')
ys,xs=np.where(mag); x0,y0=xs.min(),ys.min(); hw,hh=xs.max()-x0+1, ys.max()-y0+1

# scale the two states to hole width, bottom-aligned so button sits near hole bottom
def prep(f):
    im=Image.open(HERE/f).convert('RGB')
    w=hw; h=round(im.height*w/im.width)
    return im.resize((w,h)), h
invite, ih = prep('invite_tall.png')
sent, _   = prep('sent_tall.png')
paste_y = (y0+hh) - ih                      # bottom aligned to hole bottom
# button geometry (native 1080x1360 -> scaled), for ripple/press
s = hw/1080.0
btn_cx = x0 + hw//2
btn_top = paste_y + round(1190*s); btn_bot = paste_y + round(1340*s)
btn_cy = (btn_top+btn_bot)//2
btn_l = x0 + round(45*s); btn_r = x0 + round(1035*s)

def frame(screen, ripple=None, press=0.0):
    base = Image.new('RGB',(1080,1350),GROUND)
    base.paste(screen,(x0,paste_y))
    if press>0 or ripple is not None:
        ov = Image.new('RGBA',(1080,1350),(0,0,0,0)); d=ImageDraw.Draw(ov)
        if press>0:  # subtle button press darken
            d.rounded_rectangle([btn_l,btn_top,btn_r,btn_bot], radius=(btn_bot-btn_top)//2,
                                fill=(0,0,0,int(46*press)))
        if ripple is not None:
            prog=ripple; r=int(28+prog*120); a=int(150*(1-prog))
            d.ellipse([btn_cx-r,btn_cy-r,btn_cx+r,btn_cy+r], fill=(255,255,255,int(a*0.5)))
            d.ellipse([btn_cx-r,btn_cy-r,btn_cx+r,btn_cy+r], outline=(255,255,255,a), width=6)
        base = Image.alpha_composite(base.convert('RGBA'), ov).convert('RGB')
    return Image.alpha_composite(base.convert('RGBA'), chrome).convert('RGB')

fdir=HERE/'frames5'
if fdir.exists(): shutil.rmtree(fdir)
fdir.mkdir()
def smooth(t): return t*t*(3-2*t)

i=0
def save(img):
    global i; img.save(fdir/f'f_{i:03d}.png'); i+=1

A,B,C,D = 42,10,42,16
for _ in range(A): save(frame(invite))                                   # hold invite
for k in range(B):
    p=k/(B-1); save(frame(invite, ripple=p, press=smooth(1-abs(2*p-1)))) # tap ripple
for _ in range(C): save(frame(sent))                                     # hold sent
for k in range(D):
    t=smooth((k+1)/D); blen=Image.blend(sent,invite,t); save(frame(blen))# fade back
print('frames',i)

# static fallback = clean invite frame (button visible)
frame(invite).save(HERE/'out/clover_slide5.png')

FF="/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
mp4=HERE/'clover_slide5.mp4'
r=subprocess.run([FF,"-y","-framerate","30","-i",str(fdir/'f_%03d.png'),
    "-c:v","libx264","-pix_fmt","yuv420p","-movflags","+faststart",str(mp4)],
    capture_output=True,text=True)
print('rc',r.returncode, (r.stderr[-500:] if r.returncode else str(mp4.stat().st_size//1024)+'KB'))

#!/usr/bin/env python3
import pathlib, subprocess, math, os, shutil
from PIL import Image
import numpy as np

HERE = pathlib.Path(__file__).parent
GROUND = (243,239,255)  # lavender #f3efff

# 1) chrome overlay: keyed slide with magenta -> transparent hole
key = Image.open(HERE/'keyout/clover_slide4.png').convert('RGBA')
arr = np.array(key)
mag = (arr[:,:,0]>200)&(arr[:,:,1]<80)&(arr[:,:,2]>200)
arr[mag,3] = 0
chrome = Image.fromarray(arr, 'RGBA')

ys,xs = np.where(mag)
x0,x1,y0,y1 = xs.min(), xs.max(), ys.min(), ys.max()
hw, hh = x1-x0+1, y1-y0+1

# 2) discover list scaled to hole width
disc = Image.open(HERE/'user_discover.png').convert('RGB')
sw = hw
sh = round(disc.height * sw / disc.width)
disc = disc.resize((sw, sh))
travel = max(0, sh - hh)   # vertical scroll range

frames_dir = HERE/'frames'
if frames_dir.exists(): shutil.rmtree(frames_dir)
frames_dir.mkdir()

N = 150  # 5s @30fps, ping-pong (seamless loop)
def smooth(t): return t*t*(3-2*t)
for i in range(N):
    t = i/(N-1)
    tri = 1 - abs(2*t - 1)          # 0 -> 1 -> 0
    off = round(travel * smooth(tri))
    base = Image.new('RGB', (1080,1350), GROUND)
    base.paste(disc, (x0, y0 - off))
    out = Image.alpha_composite(base.convert('RGBA'), chrome).convert('RGB')
    out.save(frames_dir/f'f_{i:03d}.png')

FF = "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
mp4 = HERE/'clover_slide4.mp4'
r = subprocess.run([FF,"-y","-framerate","30","-i",str(frames_dir/'f_%03d.png'),
    "-c:v","libx264","-pix_fmt","yuv420p","-movflags","+faststart",str(mp4)],
    capture_output=True, text=True)
print("encoder rc", r.returncode)
if r.returncode != 0:
    print(r.stderr[-800:])
else:
    print("wrote", mp4, mp4.stat().st_size//1024, "KB", "travel", travel, "px")

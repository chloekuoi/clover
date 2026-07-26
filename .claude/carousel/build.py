#!/usr/bin/env python3
import base64, pathlib, subprocess, os
HERE = pathlib.Path(__file__).parent
FONTS = (HERE/"fonts.css").read_text()

def b64(p):
    return "data:image/png;base64,"+base64.b64encode(pathlib.Path(p).read_bytes()).decode()

# screenshot assets (may be missing -> placeholder)
def asset(name):
    p = HERE/name
    return b64(p) if p.exists() else None

MARK = """<svg class="mark" viewBox="0 0 100 100" aria-hidden="true">
  <g fill="#1e3d28"><circle cx="50" cy="33" r="21"/><circle cx="50" cy="67" r="21"/>
  <circle cx="33" cy="50" r="21"/><circle cx="67" cy="50" r="21"/></g>
  <circle cx="50" cy="50" r="11" fill="#f3efff"/></svg>"""

MARK_V = """<svg class="mark-v" viewBox="0 0 100 100" aria-hidden="true">
  <g fill="#7c5cbf"><circle cx="50" cy="33" r="21"/><circle cx="50" cy="67" r="21"/>
  <circle cx="33" cy="50" r="21"/><circle cx="67" cy="50" r="21"/></g>
  <circle cx="50" cy="50" r="11" fill="#f0eef5"/></svg>"""

BASE = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px}
.slide{width:1080px;height:1350px;background:#f3efff;color:#1e3d28;
  font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;
  position:relative;overflow:hidden;padding:80px 78px;display:flex;flex-direction:column}
.s-top{display:flex;justify-content:space-between;align-items:center}
.vtag{font-weight:500;font-size:27px;letter-spacing:.18em;text-transform:uppercase;color:rgba(30,61,40,.5)}
.count{font-size:29px;font-weight:600;color:#f3efff;background:rgba(30,61,40,.55);padding:7px 24px;border-radius:999px}
.head{font-weight:700;font-size:86px;line-height:1.06;letter-spacing:-.022em;text-wrap:balance}
.head em{font-family:'Cormorant';font-style:italic;font-weight:300;color:#7c5cbf;font-size:1.34em;line-height:.9;letter-spacing:0}
.sub{color:rgba(30,61,40,.58);font-size:35px;line-height:1.42;margin-top:26px;max-width:20ch;font-weight:400}
.sub b{color:#1e3d28;font-weight:600}
.dots{position:absolute;left:0;right:0;bottom:52px;display:flex;gap:15px;justify-content:center}
.dots i{width:15px;height:15px;border-radius:50%;background:rgba(30,61,40,.16)}
.dots i.on{background:#7c5cbf}
/* center hero/cta */
.center{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:40px}
.mark{width:150px;height:150px}
.center .head{font-size:96px}
.wordmark{font-family:'Cormorant';font-weight:300;font-size:120px;line-height:1}
.tagline{font-family:'Cormorant';font-style:italic;font-weight:300;font-size:52px;color:#7c5cbf}
.badge{display:inline-flex;align-items:center;gap:14px;background:#1e3d28;color:#f3efff;font-size:34px;font-weight:500;padding:22px 44px;border-radius:999px}
.handle{font-size:32px;color:rgba(30,61,40,.55);letter-spacing:.02em}
/* problem cols */
.cols{display:grid;grid-template-columns:repeat(3,1fr);gap:34px;margin-top:64px}
.col{border-top:2px solid rgba(30,61,40,.16);padding-top:24px}
.col .lab{font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:rgba(30,61,40,.5);font-weight:600;margin-bottom:18px}
.col .txt{font-size:33px;line-height:1.32;font-weight:500}
.whisper{font-family:'Cormorant';font-style:italic;font-weight:300;font-size:54px;color:#7c5cbf;text-align:right;position:absolute;right:78px;bottom:120px}
/* phone stage */
.stage{position:absolute;left:0;right:0;bottom:-46px;display:flex;justify-content:center;gap:40px;align-items:flex-end}
.phone{border:8px solid #1e3d28;border-radius:74px 74px 0 0;overflow:hidden;background:#fff;box-shadow:0 40px 90px -34px rgba(40,20,80,.55)}
.phone img{width:100%;height:100%;object-fit:cover;display:block}
.ph1{width:560px;height:812px}
.ph2{width:452px;height:640px}
/* slide5 invite cards (fully visible) */
.stage5{position:absolute;left:0;right:0;bottom:150px;display:flex;justify-content:center;gap:46px}
.card{width:454px;height:462px;border:8px solid #1e3d28;border-radius:58px;overflow:hidden;
  background:#fff;box-shadow:0 40px 90px -34px rgba(40,20,80,.5)}
.card img{width:100%;height:100%;object-fit:cover;object-position:50% 42%;display:block}
.clabel{text-align:center;margin-top:26px;font-size:28px;color:rgba(30,61,40,.55);font-weight:500}
.card-wrap{display:flex;flex-direction:column;align-items:center}
.clabel em{font-family:'Cormorant';font-style:italic;color:#7c5cbf;font-size:1.2em}
.placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;gap:22px;background:#fff;padding:56px}
.placeholder .p-ic{width:80px;height:80px;color:#7c5cbf}
.placeholder .p-cap{font-size:30px;font-weight:600;color:#1e3d28;line-height:1.4}
.placeholder .p-cap b{color:#7c5cbf}
.placeholder .p-hint{font-size:24px;color:rgba(30,61,40,.5)}
.placeholder .mark{width:96px;height:96px;margin-bottom:6px}
/* reconstructed login screen */
.login{width:100%;height:100%;background:#ece7fb;position:relative;display:flex;
  flex-direction:column;align-items:center;justify-content:center;overflow:hidden}
.login .bigclover{position:absolute;top:42%;left:50%;transform:translate(-50%,-50%);width:360px;height:360px;opacity:.9}
.login-brand{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;gap:8px}
.login-brand .mark{width:58px;height:58px}
.lg-word{font-family:'Cormorant';font-weight:300;font-size:76px;color:#1e3d28;line-height:1}
.lg-fyc{font-family:'Cormorant';font-style:italic;font-weight:300;font-size:32px;color:#7c5cbf}
.lg-btn{position:absolute;bottom:78px;left:40px;right:40px;background:#3f5c43;color:#fff;
  font-size:30px;font-weight:600;text-align:center;padding:26px;border-radius:999px;z-index:2}
.lg-alt{position:absolute;bottom:34px;left:0;right:0;text-align:center;font-family:'Cormorant';
  font-style:italic;font-size:26px;color:rgba(30,61,40,.42);z-index:2}
/* reconstructed focus-sheet screen */
.focus{width:100%;height:100%;background:#f1efed;padding:26px 24px 0;overflow:hidden}
.fc-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px}
.fc-title{font-family:'Cormorant';font-weight:300;font-size:52px;color:#1e3d28;line-height:1}
.fc-near{font-size:22px;color:#7c5cbf;font-weight:500}
.fc-pill{display:flex;align-items:center;gap:12px;border:1.6px dashed #b9addf;border-radius:999px;
  padding:16px 20px;margin-bottom:16px}
.mark-v{width:26px;height:26px;flex-shrink:0}
.fc-pill-t{font-size:22px;color:rgba(30,61,40,.5);flex:1}
.fc-caret{color:#7c5cbf;font-size:18px}
.fc-card{background:#fff;border-radius:26px;padding:24px 22px;box-shadow:0 12px 30px -14px rgba(40,20,80,.18)}
.fc-card-h{display:flex;align-items:center;gap:12px;font-family:'Cormorant';font-weight:300;
  font-size:34px;color:#1e3d28;margin-bottom:6px}
.fc-card-h .mark{width:28px;height:28px}
.fc-lab{font-size:15px;letter-spacing:.09em;text-transform:uppercase;color:#a49eaf;font-weight:600;margin:16px 0 8px}
.fc-input{border:1.5px solid #e6e3ea;border-radius:14px;padding:15px 16px;font-size:23px;color:#1e3d28;
  display:flex;align-items:center}
.fc-loc{gap:12px}
.fc-pin{font-size:22px}.fc-loc span:nth-child(2){flex:1}
.fc-x{color:#b7b2be;font-size:20px}
.fc-avail{display:flex;align-items:center;gap:14px;margin-top:2px}
.fc-time{border:1.5px solid #e6e3ea;border-radius:14px;padding:15px 20px;font-size:23px;color:#1e3d28}
.fc-arrow{color:#8b8693;font-size:22px}
.fc-hr{margin-left:auto;background:#ece7fb;color:#5b45a0;font-weight:700;font-size:18px;
  padding:9px 16px;border-radius:999px;letter-spacing:.02em}
.fc-foot{display:flex;align-items:center;gap:18px;margin-top:26px}
.fc-cancel{font-size:23px;color:#8b8693;padding-left:12px}
.fc-save{margin-left:auto;background:#1e3d28;color:#fff;font-weight:700;font-size:24px;
  padding:18px 40px;border-radius:999px}
/* slide 1 hero */
.slide-hero{overflow:hidden}
.hero-head{margin-top:26px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:16px}
.hero-head .mark{width:100px;height:100px}
.hero-head .head{font-size:74px}
.hero-stage{position:absolute;left:0;right:0;bottom:66px;display:flex;justify-content:center}
.hero-ph{width:440px;height:600px;border-radius:56px}
.hero-ph.placeholder{flex-direction:column;align-items:center;justify-content:center;gap:20px}
/* slide 2 problem */
.p2-body{display:flex;gap:48px;margin-top:52px;align-items:flex-start}
.p2-list{flex:1;display:flex;flex-direction:column;gap:40px}
.p2-item .lab{font-size:25px;letter-spacing:.14em;text-transform:uppercase;color:rgba(30,61,40,.5);font-weight:600;margin-bottom:12px}
.p2-item .txt{font-size:38px;line-height:1.3;font-weight:500}
.whisper2{font-family:'Cormorant';font-style:italic;font-weight:300;font-size:52px;color:#7c5cbf;margin-top:8px}
.p2-card{width:392px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:24px}
.card2{width:392px;height:452px;border:8px solid #1e3d28;border-radius:52px;overflow:hidden;background:#fff;
  box-shadow:0 34px 80px -34px rgba(40,20,80,.5);filter:grayscale(.55) opacity(.82)}
.card2 img{width:100%;height:100%;object-fit:cover;object-position:50% 22%;display:block}
.card2-tag{font-size:29px;color:rgba(30,61,40,.6);font-weight:500;text-align:center}
.card2-tag em{font-family:'Cormorant';font-style:italic;color:#7c5cbf;font-size:1.22em}
"""

def phone(asset_uri, cls, obj_pos, label_html):
    if asset_uri:
        return f'<div class="phone {cls}"><img src="{asset_uri}" style="object-position:{obj_pos}"></div>'
    return f'<div class="phone {cls} placeholder">{label_html}</div>'

PIN = '<svg class="p-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/></svg>'
PPL = '<svg class="p-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="9.5" r="2.2"/><path d="M15 19a4.6 4.6 0 0 1 6.5-3.4"/></svg>'

def dots(n):
    return '<div class="dots">'+''.join(f'<i class="{"on" if i==n else ""}"></i>' for i in range(6))+'</div>'

slides = {}

# reconstructed login screen (no screenshot file needed)
BIGCLOVER = """<svg class="bigclover" viewBox="0 0 100 100" aria-hidden="true">
  <g fill="#e3ddf4"><circle cx="50" cy="34" r="22"/><circle cx="50" cy="66" r="22"/>
  <circle cx="34" cy="50" r="22"/><circle cx="66" cy="50" r="22"/></g>
  <circle cx="50" cy="50" r="13" fill="#f5f1ff"/></svg>"""
LOGIN_SCREEN = f"""<div class="login">
  {BIGCLOVER}
  <div class="login-brand">{MARK}<div class="lg-word">clover</div><div class="lg-fyc">find your clover</div></div>
  <div class="lg-btn">Get Started</div>
  <div class="lg-alt">I already have an account</div>
</div>"""

# 1 HERO (headline + login phone)
_login = asset('user_login.png')
_login_phone = (f'<div class="phone hero-ph"><img src="{_login}" style="object-position:50% 0%"></div>'
    if _login else
    f'<div class="phone hero-ph">{LOGIN_SCREEN}</div>')
slides[1] = f"""<div class="slide slide-hero">
  <div class="s-top"><span class="vtag">Clover — V.1.0.0</span><span></span></div>
  <div class="hero-head">{MARK}
    <h2 class="head">Meet the interesting people<br><em>in this café.</em></h2>
    <p class="tagline">check in to see who's here</p>
  </div>
  <div class="hero-stage">{_login_phone}</div>{dots(0)}</div>"""

# 2 PROBLEM (text list + greyed profile card)
slides[2] = f"""<div class="slide">
  <div class="s-top"><span class="vtag">The problem</span><span class="count">2 / 6</span></div>
  <h2 class="head" style="margin-top:36px;font-size:78px">You're in the same café.<br><em>You'll never know.</em></h2>
  <div class="p2-body">
    <div class="p2-list">
      <div class="p2-item"><div class="lab">Cafés</div><div class="txt">5 people you'd click with, 3 ft away, zero hellos.</div></div>
      <div class="p2-item"><div class="lab">Coworking</div><div class="txt">Paid for the desk. Left knowing no one.</div></div>
      <div class="p2-item"><div class="lab">Remote</div><div class="txt">Your best coworker is one table over.</div></div>
      <div class="whisper2">there's a better way</div>
    </div>
    <div class="p2-card">
      <div class="card2"><img src="{asset('card_profile.png')}"></div>
      <div class="card2-tag">someone you'll <em>never meet</em></div>
    </div>
  </div>{dots(1)}</div>"""

# reconstructed focus-sheet screen (no screenshot file needed)
FOCUS_SCREEN = f"""<div class="focus">
  <div class="fc-head"><span class="fc-title">Discover</span><span class="fc-near">5 working nearby</span></div>
  <div class="fc-pill">{MARK_V}<span class="fc-pill-t">Today&#39;s focus…</span><span class="fc-caret">▲</span></div>
  <div class="fc-card">
    <div class="fc-card-h">{MARK}<span>Today&#39;s focus</span></div>
    <div class="fc-lab">What are you working on?</div>
    <div class="fc-input">Coworking App</div>
    <div class="fc-lab">Location</div>
    <div class="fc-input fc-loc"><span class="fc-pin">📍</span><span>NEO COFFEE BAR KING X SPADINA</span><span class="fc-x">✕</span></div>
    <div class="fc-lab">Available</div>
    <div class="fc-avail">
      <span class="fc-time">4:30 PM</span><span class="fc-arrow">→</span><span class="fc-time">6:30 PM</span>
      <span class="fc-hr">2 HR</span>
    </div>
    <div class="fc-foot"><span class="fc-cancel">Cancel</span><span class="fc-save">Save focus</span></div>
  </div>
</div>"""

# 3 CHECK IN
_focus = asset('user_focus.png')
_focus_phone = (f'<div class="phone ph1"><img src="{_focus}" style="object-position:50% 26%"></div>'
    if _focus else f'<div class="phone ph1">{FOCUS_SCREEN}</div>')
slides[3] = f"""<div class="slide">
  <div class="s-top"><span class="vtag">How it works</span><span class="count">3 / 6</span></div>
  <h2 class="head" style="margin-top:40px">Set your focus,<br><em>drop a pin.</em></h2>
  <p class="sub">Tap where you're working, set your window — you're on the map.</p>
  <div class="stage">{_focus_phone}</div>
  {dots(2)}</div>"""

# 4 WHO'S HERE
slides[4] = f"""<div class="slide">
  <div class="s-top"><span class="vtag">The magic moment</span><span class="count">4 / 6</span></div>
  <h2 class="head" style="margin-top:40px">See who's<br><em>here right now.</em></h2>
  <p class="sub">Real people at your café, working today.</p>
  <div class="stage">{'<div class="phone ph1"><div class="keyscreen"></div></div>' if os.environ.get('KEYSCREEN') else phone(asset('user_discover.png'),'ph1','50% 0%',f'{PPL}<div class="p-cap">Drop in your<br><b>Discover list</b> screenshot</div><div class="p-hint">"5 working nearby"</div>')}</div>
  {dots(3)}</div>"""

# 5 INVITE (single phone; video shows the tap -> sent)
_s5 = ('<div class="phone ph1"><div class="keyscreen"></div></div>' if os.environ.get('KEYSCREEN')
       else f'<div class="phone ph1"><img src="{asset("invite_tall.png")}" style="object-position:50% 100%"></div>')
slides[5] = f"""<div class="slide">
  <div class="s-top"><span class="vtag">The payoff</span><span class="count">5 / 6</span></div>
  <h2 class="head" style="margin-top:40px">Invite before your<br><em>coffee's cold.</em></h2>
  <p class="sub">Open a profile → tap <b>Invite to co-work today.</b></p>
  <div class="stage">{_s5}</div>{dots(4)}</div>"""

# 6 CTA
slides[6] = f"""<div class="slide">
  <div class="s-top"><span class="vtag">Clover — V.1.0.0</span><span class="count">6 / 6</span></div>
  <div class="center">{MARK}
    <h2 class="head" style="font-size:88px">Find your clover.<br><em>Do the work.</em></h2>
    <div class="badge">◍ Now on iOS · TestFlight</div>
    <div class="handle">@clover.app</div>
  </div>{dots(5)}</div>"""

GROUND = os.environ.get('GROUND', '#f3efff')
BASE = BASE.replace('height:1350px;background:#f3efff;', f'height:1350px;background:{GROUND};')
BASE += ".keyscreen{width:100%;height:100%;background:#ff00ff}"

CH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
outdir = HERE/('keyout' if os.environ.get('KEYSCREEN') else ('out_white' if GROUND != '#f3efff' else 'out')); outdir.mkdir(exist_ok=True)
for n,inner in slides.items():
    html = f"<!doctype html><meta charset=utf8><style>{FONTS}</style><style>{BASE}</style>{inner}"
    f = HERE/f"slide{n}.html"; f.write_text(html)
    png = outdir/f"clover_slide{n}.png"
    subprocess.run([CH,"--headless","--no-sandbox","--hide-scrollbars",
        "--force-device-scale-factor=1","--window-size=1080,1350",
        f"--screenshot={png}", f"file://{f}"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print("rendered", png.name)

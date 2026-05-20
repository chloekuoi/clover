import { useState } from "react";

// Colors extracted from Good Bagel shop
// Clean white beadboard, blonde wood counters, warm spot lighting,
// industrial metal accents, kraft paper, dark chalkboard contrast
const gb = {
  // Backgrounds (white beadboard paneling, clean walls)
  canvas: "#FAFAF7",
  panel: "#F3F1EC",
  tile: "#EBE8E2",

  // Blonde wood (countertops, shelving)
  maple: "#C8AB80",
  oak: "#B89B6E",
  birch: "#D4BC96",

  // Industrial metal & dark accents (wire baskets, chalkboard, fixtures)
  charcoal: "#3C3836",
  iron: "#5A5652",
  pewter: "#7A766E",

  // Warm lighting (pendant lamps, spot lights)
  warmWhite: "#F5EDDA",
  glow: "#EDE2CC",

  // Soft sage (pendant lamp shade, subtle green)
  sage: "#B8C4AE",
  mintLamp: "#C2CCBA",

  // Kraft & labels (paper bags, blush-pink labels)
  kraft: "#C4AA82",
  label: "#E8CFC0",
  blushTag: "#DFBFB2",

  // Text
  heading: "#2E2A26",
  body: "#5E5A54",
  caption: "#9A948C",
  muted: "#B8B2AA",
};

export default function GoodBagelMockup() {
  const [task, setTask] = useState("");
  const [selectedVibe, setSelectedVibe] = useState("Flexible");
  const [selectedLoc, setSelectedLoc] = useState("Cafe");
  const [inputFocused, setInputFocused] = useState(false);

  const vibes = [
    { label: "Deep focus", emoji: "🎧" },
    { label: "Chat mode", emoji: "💬" },
    { label: "Flexible", emoji: "✌️" },
  ];
  const locs = [
    { label: "Cafe", emoji: "☕" },
    { label: "Library", emoji: "📚" },
    { label: "Anywhere", emoji: "📍" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes float1 {
          0%, 100% { transform: translate(0,0); }
          50% { transform: translate(12px, -10px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0,0); }
          50% { transform: translate(-10px, 14px); }
        }
      `}</style>

      {/* Background — clean and bright like the white paneling */}
      <div style={{
        position: "fixed", inset: 0,
        background: `linear-gradient(175deg, ${gb.canvas} 0%, ${gb.panel} 50%, ${gb.tile} 100%)`,
      }} />

      {/* Warm overhead glow — like pendant lights */}
      <div style={{
        position: "fixed", top: -60, left: "30%",
        width: 200, height: 200,
        background: `radial-gradient(circle, ${gb.warmWhite}50, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", top: -40, right: "20%",
        width: 160, height: 160,
        background: `radial-gradient(circle, ${gb.warmWhite}35, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* Subtle ambient */}
      <div style={{
        position: "fixed", width: 180, height: 180, borderRadius: "50%",
        background: `radial-gradient(circle, ${gb.sage}12, transparent)`,
        bottom: 100, right: -30, animation: "float1 15s ease-in-out infinite", pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", width: 160, height: 160, borderRadius: "50%",
        background: `radial-gradient(circle, ${gb.birch}10, transparent)`,
        top: "40%", left: -30, animation: "float2 12s ease-in-out infinite", pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 400, margin: "0 auto", padding: "52px 22px 140px",
      }}>

        {/* Header — clean, utilitarian like the shop signage */}
        <p style={{
          margin: "0 0 6px", fontSize: 12, color: gb.caption,
          fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase",
        }}>
          Set availability to connect
        </p>
        <h1 style={{
          margin: "0 0 26px",
          fontSize: 28,
          fontWeight: 700,
          color: gb.heading,
          lineHeight: 1.15,
          letterSpacing: -0.5,
        }}>
          Today's focus
        </h1>

        {/* Task input */}
        <div style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: inputFocused
            ? `1.5px solid ${gb.charcoal}30`
            : "1px solid rgba(255,255,255,0.5)",
          borderRadius: 14, padding: 3, marginBottom: 14,
          boxShadow: inputFocused
            ? `0 0 0 3px ${gb.charcoal}06, 0 2px 12px rgba(46,42,38,0.04)`
            : "0 1px 6px rgba(46,42,38,0.02)",
          transition: "all 0.2s ease",
        }}>
          <input
            type="text"
            placeholder="e.g., Writing a blog post"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              width: "100%", padding: "12px 16px",
              background: "transparent", border: "none", borderRadius: 11,
              fontSize: 15, color: gb.heading, fontFamily: "inherit",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Vibe + Location card */}
        <div style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.4)",
          borderRadius: 18, padding: "18px 16px", marginBottom: 14,
          boxShadow: "0 2px 16px rgba(46,42,38,0.04), 0 1px 2px rgba(46,42,38,0.02)",
        }}>
          {/* Work vibe */}
          <p style={{
            fontSize: 11, fontWeight: 600, color: gb.caption, margin: "0 0 10px",
            textTransform: "uppercase", letterSpacing: 1.2,
          }}>
            Work vibe
          </p>
          <div style={{ display: "flex", gap: 7, marginBottom: 16 }}>
            {vibes.map((v) => {
              const sel = v.label === selectedVibe;
              return (
                <button
                  key={v.label}
                  onClick={() => setSelectedVibe(v.label)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 5, padding: "10px 6px", borderRadius: 10,
                    border: sel ? `1.5px solid ${gb.charcoal}` : "1px solid rgba(0,0,0,0.06)",
                    background: sel ? gb.charcoal : "rgba(255,255,255,0.6)",
                    color: sel ? gb.canvas : gb.body,
                    fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s ease", whiteSpace: "nowrap",
                    boxShadow: sel ? "0 2px 8px rgba(60,56,54,0.2)" : "0 1px 2px rgba(0,0,0,0.02)",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{v.emoji}</span>
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Divider — thin, industrial like the wire shelving */}
          <div style={{
            height: 1, margin: "0 -16px 16px",
            background: `linear-gradient(90deg, transparent, ${gb.tile}, transparent)`,
          }} />

          {/* Where */}
          <p style={{
            fontSize: 11, fontWeight: 600, color: gb.caption, margin: "0 0 10px",
            textTransform: "uppercase", letterSpacing: 1.2,
          }}>
            Where
          </p>
          <div style={{ display: "flex", gap: 7 }}>
            {locs.map((l) => {
              const sel = l.label === selectedLoc;
              return (
                <button
                  key={l.label}
                  onClick={() => setSelectedLoc(l.label)}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 5, padding: "10px 6px", borderRadius: 10,
                    border: sel ? `1.5px solid ${gb.charcoal}` : "1px solid rgba(0,0,0,0.06)",
                    background: sel ? gb.charcoal : "rgba(255,255,255,0.6)",
                    color: sel ? gb.canvas : gb.body,
                    fontSize: 12.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s ease", whiteSpace: "nowrap",
                    boxShadow: sel ? "0 2px 8px rgba(60,56,54,0.2)" : "0 1px 2px rgba(0,0,0,0.02)",
                  }}
                >
                  <span style={{ fontSize: 13 }}>{l.emoji}</span>
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Available */}
        <div style={{ marginBottom: 14 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: 1.2, color: gb.caption, margin: "0 0 8px",
          }}>
            Available
          </p>
          <div style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.4)",
            borderRadius: 12, padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={gb.muted} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: gb.heading }}>11:30 AM</span>
            <span style={{ color: gb.muted }}>—</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: gb.heading }}>1:30 PM</span>
            <span style={{
              marginLeft: "auto", fontSize: 11, fontWeight: 600,
              color: gb.iron, background: gb.tile,
              padding: "3px 10px", borderRadius: 20,
            }}>2h</span>
          </div>
        </div>

        {/* Add place */}
        <button style={{
          width: "100%", padding: "11px 16px",
          background: "transparent",
          border: `1.5px dashed ${gb.muted}60`,
          borderRadius: 12, fontSize: 13, color: gb.caption,
          cursor: "pointer", fontFamily: "inherit", textAlign: "left",
        }}>
          + Add a specific place <span style={{ color: gb.muted }}>(optional)</span>
        </button>

        {/* ── Extra components ── */}
        <div style={{ marginTop: 32 }}>
          <p style={{
            fontSize: 11, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: 1.2, color: gb.caption, margin: "0 0 12px",
          }}>
            Other components
          </p>

          {/* Pending card */}
          <div style={{
            background: "rgba(255,255,255,0.55)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.4)",
            borderRadius: 14, padding: "13px 15px",
            display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: gb.glow,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gb.oak} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: gb.heading }}>Cowork Invite</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5,
                  color: gb.oak, background: gb.glow, padding: "2px 8px", borderRadius: 999,
                }}>Pending</span>
              </div>
              <span style={{ fontSize: 12, color: gb.caption }}>Fri, Feb 14</span>
            </div>
            <div style={{
              width: 28, height: 28, borderRadius: 28,
              background: "rgba(255,255,255,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: gb.muted, fontSize: 12, cursor: "pointer",
            }}>✕</div>
          </div>

          {/* Chat */}
          <div style={{
            background: "rgba(255,255,255,0.35)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 18, padding: 16,
          }}>
            <div style={{
              background: "rgba(255,255,255,0.65)",
              borderRadius: "12px 12px 12px 4px",
              padding: "10px 14px", maxWidth: "75%", marginBottom: 8,
            }}>
              <span style={{ fontSize: 14, color: gb.heading }}>Hey, grabbing bagels — want one?</span>
            </div>
            <div style={{
              background: gb.charcoal,
              borderRadius: "12px 12px 4px 12px",
              padding: "10px 14px", maxWidth: "75%", marginLeft: "auto", marginBottom: 4,
              boxShadow: "0 2px 8px rgba(60,56,54,0.15)",
            }}>
              <span style={{ fontSize: 14, color: gb.canvas }}>Everything with cream cheese please 🥯</span>
            </div>
            <p style={{ textAlign: "right", fontSize: 11, color: gb.caption, margin: "4px 0 0" }}>12:10 PM</p>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10,
      }}>
        <div style={{
          background: `rgba(243,241,236,0.75)`,
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.5)",
          padding: "14px 22px 34px",
        }}>
          <button style={{
            width: "100%", maxWidth: 400, margin: "0 auto", display: "block",
            padding: "14px 0",
            background: gb.charcoal,
            border: "none", borderRadius: 12,
            color: gb.canvas,
            fontSize: 15, fontWeight: 600, letterSpacing: 0.2,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 4px 16px rgba(60,56,54,0.2), 0 2px 4px rgba(60,56,54,0.1)",
          }}>
            Find Co-Workers
          </button>
        </div>
      </div>
    </div>
  );
}

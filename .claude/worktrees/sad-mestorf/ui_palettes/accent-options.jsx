import { useState } from "react";

const alternatives = [
  {
    name: "Espresso (current)",
    hex: "#4A3C30",
    desc: "Rich & deep — the original",
  },
  {
    name: "Cocoa",
    hex: "#6B5744",
    desc: "Warmer mid-brown — like milk chocolate",
  },
  {
    name: "Umber",
    hex: "#7C6350",
    desc: "Earthy clay — warm and grounded",
  },
  {
    name: "Mocha",
    hex: "#8B7360",
    desc: "Soft coffee — lighter, approachable",
  },
  {
    name: "Toffee",
    hex: "#6E5A3B",
    desc: "Golden brown — warm with amber undertone",
  },
  {
    name: "Chestnut",
    hex: "#6A4F3C",
    desc: "Reddish brown — rich with warmth",
  },
  {
    name: "Latte",
    hex: "#9C8572",
    desc: "Creamy coffee — soft, light, inviting",
  },
];

const palette = {
  parchment: "#FAF6F1",
  linen: "#F6F1EB",
  cream: "#EDE7DF",
  stone: "#B8AFA4",
  fog: "#D6D0C8",
  walnut: "#7A6654",
  honey: "#C9A86C",
  blush: "#D4A49A",
  driftwood: "#A8927B",
};

export default function AccentComparison() {
  const [active, setActive] = useState(1); // Default to Cocoa

  const current = alternatives[active];

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(145deg, ${palette.parchment}, ${palette.linen}, ${palette.cream})`,
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -15px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-15px, 20px); }
        }
      `}</style>

      {/* Ambient blobs */}
      <div style={{
        position: "fixed", width: 250, height: 250, borderRadius: "50%",
        background: `radial-gradient(circle, ${palette.blush}35, transparent)`,
        top: -30, right: -50, animation: "float1 12s ease-in-out infinite", pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", width: 200, height: 200, borderRadius: "50%",
        background: `radial-gradient(circle, ${palette.honey}25, transparent)`,
        bottom: 100, left: -40, animation: "float2 14s ease-in-out infinite", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 440, margin: "0 auto", padding: "40px 22px 60px" }}>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#4A3C30", margin: "0 0 4px", letterSpacing: -0.3 }}>
          Accent Color Alternatives
        </h1>
        <p style={{ fontSize: 13, color: palette.stone, margin: "0 0 32px" }}>
          Tap each swatch to preview it across all components
        </p>

        {/* Color swatches */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
          {alternatives.map((alt, i) => (
            <button
              key={alt.name}
              onClick={() => setActive(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 14,
                border: i === active
                  ? `2px solid ${alt.hex}`
                  : "1px solid rgba(255,255,255,0.4)",
                background: i === active
                  ? "rgba(255,255,255,0.6)"
                  : "rgba(255,255,255,0.35)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s ease",
                boxShadow: i === active ? `0 2px 12px ${alt.hex}20` : "none",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: alt.hex,
                boxShadow: `0 2px 8px ${alt.hex}30`,
              }} />
              <div style={{ textAlign: "left" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: alt.hex }}>{alt.name}</p>
                <p style={{ margin: 0, fontSize: 10, color: palette.stone }}>{alt.hex}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── LIVE PREVIEW ── */}
        <p style={{
          fontSize: 11, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: 1.2, color: palette.stone, margin: "0 0 16px",
        }}>
          Live Preview — {current.name}
        </p>

        {/* Glass card with chips */}
        <div style={{
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 20,
          padding: "20px 18px",
          marginBottom: 16,
          boxShadow: "0 4px 24px rgba(74,60,48,0.06)",
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: current.hex, margin: "0 0 10px" }}>
            Work vibe
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {["🎧 Deep focus", "💬 Chat mode", "✌️ Flexible"].map((label, i) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: "10px 6px",
                  borderRadius: 12,
                  border: i === 2 ? `1.5px solid ${current.hex}` : "1px solid rgba(255,255,255,0.4)",
                  background: i === 2 ? current.hex : "rgba(255,255,255,0.4)",
                  backdropFilter: i === 2 ? "none" : "blur(8px)",
                  color: i === 2 ? palette.parchment : palette.walnut,
                  fontSize: 12.5,
                  fontWeight: 500,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  boxShadow: i === 2 ? `0 2px 8px ${current.hex}30` : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            margin: "0 -18px 18px",
          }} />

          <p style={{ fontSize: 13, fontWeight: 600, color: current.hex, margin: "0 0 10px" }}>
            Where
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {["☕ Cafe", "📚 Library", "📍 Anywhere"].map((label, i) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  padding: "10px 6px",
                  borderRadius: 12,
                  border: i === 0 ? `1.5px solid ${current.hex}` : "1px solid rgba(255,255,255,0.4)",
                  background: i === 0 ? current.hex : "rgba(255,255,255,0.4)",
                  backdropFilter: i === 0 ? "none" : "blur(8px)",
                  color: i === 0 ? palette.parchment : palette.walnut,
                  fontSize: 12.5,
                  fontWeight: 500,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  boxShadow: i === 0 ? `0 2px 8px ${current.hex}30` : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* CTA button */}
        <button style={{
          width: "100%",
          padding: "15px 0",
          background: current.hex,
          border: "none",
          borderRadius: 14,
          color: palette.parchment,
          fontSize: 15.5,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: `0 4px 20px ${current.hex}30, 0 2px 6px ${current.hex}20`,
          marginBottom: 16,
          transition: "all 0.3s ease",
        }}>
          Find Co-Workers
        </button>

        {/* Heading sample */}
        <div style={{
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 20,
          padding: "22px 20px",
          marginBottom: 16,
          boxShadow: "0 4px 24px rgba(74,60,48,0.06)",
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: palette.stone, margin: "0 0 12px" }}>
            Typography preview
          </p>
          <p style={{ fontSize: 26, fontWeight: 700, color: current.hex, margin: "0 0 4px", letterSpacing: -0.3, transition: "color 0.3s ease" }}>
            Today's focus
          </p>
          <p style={{ fontSize: 15, color: palette.driftwood, margin: "0 0 12px" }}>
            Set availability to connect with co-workers nearby
          </p>
          <p style={{ fontSize: 13, color: palette.stone, margin: 0 }}>
            Secondary caption text · 1:30 PM
          </p>
        </div>

        {/* Pending card */}
        <div style={{
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 16,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
          boxShadow: "0 2px 12px rgba(74,60,48,0.05)",
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: "#FDF6E8",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.honey} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: current.hex, transition: "color 0.3s ease" }}>
                Cowork Invite
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.6,
                color: palette.honey, background: "#FDF6E8", padding: "2px 8px", borderRadius: 999,
              }}>Pending</span>
            </div>
            <span style={{ fontSize: 12.5, color: palette.stone }}>Fri, Feb 14</span>
          </div>
          <div style={{
            width: 30, height: 30, borderRadius: 30,
            background: "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: palette.stone, fontSize: 13, cursor: "pointer",
          }}>✕</div>
        </div>

        {/* Chat bubbles */}
        <div style={{
          background: "rgba(255,255,255,0.3)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 20,
          padding: 18,
        }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: palette.stone, margin: "0 0 12px" }}>
            Chat preview
          </p>
          <div style={{
            background: "rgba(255,255,255,0.6)",
            borderRadius: "14px 14px 14px 4px",
            padding: "10px 14px",
            maxWidth: "75%",
            marginBottom: 8,
            border: "1px solid rgba(255,255,255,0.4)",
          }}>
            <span style={{ fontSize: 14, color: current.hex, transition: "color 0.3s ease" }}>
              Hey, want to cowork today?
            </span>
          </div>
          <div style={{
            background: current.hex,
            borderRadius: "14px 14px 4px 14px",
            padding: "10px 14px",
            maxWidth: "75%",
            marginLeft: "auto",
            marginBottom: 4,
            boxShadow: `0 2px 8px ${current.hex}25`,
            transition: "all 0.3s ease",
          }}>
            <span style={{ fontSize: 14, color: palette.parchment }}>
              Sure! See you at 2pm ☕
            </span>
          </div>
          <p style={{ textAlign: "right", fontSize: 11, color: palette.stone, margin: "4px 0 0" }}>2:15 PM</p>
        </div>

      </div>
    </div>
  );
}

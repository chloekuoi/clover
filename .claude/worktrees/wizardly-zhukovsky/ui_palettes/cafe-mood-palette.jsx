import { useState } from "react";

// Colors extracted from the café image
const palette = {
  // Warm whites & creams (the walls, ceramics, paper cups)
  linen: "#F6F1EB",
  cream: "#EDE7DF",
  parchment: "#FAF6F1",
  
  // Natural wood tones (shelves, countertop)
  driftwood: "#A8927B",
  walnut: "#7A6654",
  espresso: "#4A3C30",
  
  // Warm greys (backsplash, soft shadows)
  fog: "#D6D0C8",
  stone: "#B8AFA4",
  
  // Accent pops (dried flowers, berries, pink tags)
  terracotta: "#C4735A",
  berry: "#9E4B5A",
  blush: "#D4A49A",
  dustyRose: "#C99A8E",
  
  // Warm gold (pampas grass, warm lighting, mustard pillow)
  wheat: "#D4B896",
  honey: "#C9A86C",
  saffron: "#B89355",
};

const Swatch = ({ color, name, size = 56 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    <div style={{
      width: size,
      height: size,
      borderRadius: 12,
      background: color,
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    }} />
    <span style={{ fontSize: 9, fontFamily: "monospace", color: "#8A7E72", fontWeight: 600 }}>{color}</span>
    <span style={{ fontSize: 10, color: "#A89E92" }}>{name}</span>
  </div>
);

export default function CafeMoodBoard() {
  const [selectedVibe, setSelectedVibe] = useState("Flexible");
  const [selectedLoc, setSelectedLoc] = useState("Cafe");

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
      background: palette.parchment,
      fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px 60px" }}>

        {/* Header */}
        <h1 style={{
          fontSize: 24, fontWeight: 700, color: palette.espresso,
          margin: "0 0 4px", letterSpacing: -0.3,
        }}>
          Café Mood → App Palette
        </h1>
        <p style={{ fontSize: 13, color: palette.stone, margin: "0 0 36px" }}>
          Warm minimalism · Natural textures · Quiet confidence
        </p>

        {/* ── EXTRACTED PALETTE ── */}
        <SectionLabel color={palette.stone}>Extracted Colors</SectionLabel>

        <p style={{ fontSize: 11, fontWeight: 600, color: palette.walnut, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 1 }}>
          Warm Whites — backgrounds & canvas
        </p>
        <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          <Swatch color={palette.parchment} name="Parchment" />
          <Swatch color={palette.linen} name="Linen" />
          <Swatch color={palette.cream} name="Cream" />
        </div>

        <p style={{ fontSize: 11, fontWeight: 600, color: palette.walnut, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 1 }}>
          Natural Woods — text & primary accent
        </p>
        <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          <Swatch color={palette.espresso} name="Espresso" />
          <Swatch color={palette.walnut} name="Walnut" />
          <Swatch color={palette.driftwood} name="Driftwood" />
        </div>

        <p style={{ fontSize: 11, fontWeight: 600, color: palette.walnut, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 1 }}>
          Warm Neutrals — borders & secondary
        </p>
        <div style={{ display: "flex", gap: 14, marginBottom: 24, flexWrap: "wrap" }}>
          <Swatch color={palette.fog} name="Fog" />
          <Swatch color={palette.stone} name="Stone" />
          <Swatch color={palette.wheat} name="Wheat" />
        </div>

        <p style={{ fontSize: 11, fontWeight: 600, color: palette.walnut, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 1 }}>
          Accent Pops — status & highlights
        </p>
        <div style={{ display: "flex", gap: 14, marginBottom: 40, flexWrap: "wrap" }}>
          <Swatch color={palette.terracotta} name="Terracotta" />
          <Swatch color={palette.blush} name="Blush" />
          <Swatch color={palette.honey} name="Honey" />
          <Swatch color={palette.berry} name="Berry" />
        </div>

        {/* ── DESIGN TAKEAWAYS ── */}
        <SectionLabel color={palette.stone}>Design Takeaways</SectionLabel>

        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 22,
          boxShadow: "0 1px 2px rgba(74,60,48,0.04), 0 4px 12px rgba(74,60,48,0.04)",
          marginBottom: 40,
        }}>
          {[
            {
              num: "01",
              title: "Warmth lives in the background, not the foreground",
              desc: "The café walls are soft parchment, not pure white. This warmth wraps everything without competing. Use #FAF6F1 as your canvas instead of #FFFFFF — it's the single biggest shift to match this vibe.",
            },
            {
              num: "02",
              title: "Dark espresso replaces black",
              desc: "Nothing in this photo is true black. The darkest tones are rich brown (#4A3C30). Using espresso for headings and selected states feels grounded, not harsh.",
            },
            {
              num: "03",
              title: "The 90/5/5 rule",
              desc: "90% warm neutrals (creams, linens, wood). 5% structure (warm grey borders). 5% accent pops (terracotta, berry). The café uses color sparingly — the red flowers and pink tags pop precisely because everything else is quiet.",
            },
            {
              num: "04",
              title: "Texture through subtle layering",
              desc: "The herringbone tile, woven baskets, and linen apron create depth through texture, not color contrast. In UI: use barely-there shadows, soft borders, and the cream→linen→parchment layering to create depth.",
            },
            {
              num: "05",
              title: "Organic, not geometric",
              desc: "Rounded corners everywhere. Soft pill shapes. Nothing feels sharp or rigid. Increase border-radius to 14-16px for cards, keep chips at 12px with generous padding.",
            },
            {
              num: "06",
              title: "Gold as the warm accent",
              desc: "The warm lighting and honey/wheat tones in the image feel premium and inviting. Use honey (#C9A86C) for pending states and gentle highlights instead of cold amber.",
            },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: i < 5 ? 20 : 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: palette.driftwood, fontFamily: "monospace" }}>
                  {item.num}
                </span>
                <p style={{ fontSize: 14, fontWeight: 600, color: palette.espresso, margin: 0 }}>
                  {item.title}
                </p>
              </div>
              <p style={{ fontSize: 13, color: palette.walnut, margin: "4px 0 0", lineHeight: 1.5, paddingLeft: 28 }}>
                {item.desc}
              </p>
              {i < 5 && <div style={{ height: 1, background: palette.cream, margin: "20px 0 0" }} />}
            </div>
          ))}
        </div>

        {/* ── MAPPED TO APP TOKENS ── */}
        <SectionLabel color={palette.stone}>Mapped to App Tokens</SectionLabel>

        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 20,
          boxShadow: "0 1px 2px rgba(74,60,48,0.04), 0 4px 12px rgba(74,60,48,0.04)",
          marginBottom: 40,
          fontFamily: "monospace",
          fontSize: 12,
          lineHeight: 2,
          color: palette.walnut,
        }}>
          <Row label="bg-primary" old="#FAFAF8" next={palette.parchment} />
          <Row label="bg-secondary" old="#F4F3F0" next={palette.linen} />
          <Row label="bg-card" old="#FFFFFF" next="#FFFFFF" note="keep — creates lift" />
          <Row label="text-primary" old="#1A1A1A" next={palette.espresso} />
          <Row label="text-secondary" old="#6B6B6B" next={palette.walnut} />
          <Row label="text-tertiary" old="#9B9B9B" next={palette.stone} />
          <Row label="border-default" old="#E8E8E4" next={palette.fog} />
          <Row label="accent-primary" old="#3D3D3D" next={palette.espresso} />
          <Row label="accent-warning" old="#C4973B" next={palette.honey} />
          <Row label="accent-danger" old="#B85C4D" next={palette.terracotta} />
          <Row label="divider" old="#F0EFEC" next={palette.cream} />
        </div>

        {/* ── LIVE COMPONENT PREVIEW ── */}
        <SectionLabel color={palette.stone}>Components in New Palette</SectionLabel>

        {/* Card preview */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: 18,
          boxShadow: "0 1px 2px rgba(74,60,48,0.04), 0 4px 12px rgba(74,60,48,0.04)",
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: palette.espresso, margin: "0 0 10px" }}>
            Work vibe
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {vibes.map((v) => {
              const sel = v.label === selectedVibe;
              return (
                <button
                  key={v.label}
                  onClick={() => setSelectedVibe(v.label)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "10px 6px",
                    borderRadius: 12,
                    border: `1.5px solid ${sel ? palette.espresso : palette.fog}`,
                    background: sel ? palette.espresso : "transparent",
                    color: sel ? "#FAF6F1" : palette.walnut,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{v.emoji}</span>
                  {v.label}
                </button>
              );
            })}
          </div>
          <div style={{ height: 1, background: palette.cream, margin: "0 -18px 16px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: palette.espresso, margin: "0 0 10px" }}>
            Where
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {locs.map((l) => {
              const sel = l.label === selectedLoc;
              return (
                <button
                  key={l.label}
                  onClick={() => setSelectedLoc(l.label)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "10px 6px",
                    borderRadius: 12,
                    border: `1.5px solid ${sel ? palette.espresso : palette.fog}`,
                    background: sel ? palette.espresso : "transparent",
                    color: sel ? "#FAF6F1" : palette.walnut,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{l.emoji}</span>
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input */}
        <input
          type="text"
          placeholder="e.g., Writing a blog post"
          style={{
            width: "100%",
            padding: "13px 16px",
            background: "#fff",
            border: `1.5px solid ${palette.fog}`,
            borderRadius: 12,
            fontSize: 15,
            color: palette.espresso,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 16,
          }}
        />

        {/* Time */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          borderRadius: 12,
          padding: "13px 16px",
          border: `1.5px solid ${palette.fog}`,
          marginBottom: 16,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={palette.stone} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: palette.espresso }}>11:30 AM</span>
          <span style={{ color: palette.fog, fontSize: 12 }}>—</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: palette.espresso }}>1:30 PM</span>
          <span style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 600,
            color: palette.walnut,
            background: palette.cream,
            padding: "3px 9px",
            borderRadius: 20,
          }}>2h</span>
        </div>

        {/* CTA */}
        <button style={{
          width: "100%",
          padding: "15px 0",
          background: palette.espresso,
          border: "none",
          borderRadius: 12,
          color: palette.parchment,
          fontSize: 15,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 2px 6px rgba(74,60,48,0.2), 0 4px 16px rgba(74,60,48,0.1)",
          marginBottom: 16,
        }}>
          Find Co-Workers
        </button>

        {/* Pending card */}
        <div style={{
          background: "#fff",
          borderRadius: 16,
          padding: "14px 16px",
          boxShadow: "0 1px 2px rgba(74,60,48,0.04), 0 4px 12px rgba(74,60,48,0.04)",
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
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
              <span style={{ fontSize: 15, fontWeight: 600, color: palette.espresso }}>Cowork Invite</span>
              <span style={{
                fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8,
                color: palette.honey, background: "#FDF6E8", padding: "3px 10px", borderRadius: 999,
              }}>Pending</span>
            </div>
            <span style={{ fontSize: 12.5, color: palette.stone }}>Fri, Feb 14</span>
          </div>
          <div style={{
            width: 30, height: 30, borderRadius: 30,
            background: palette.linen,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: palette.stone, fontSize: 14, cursor: "pointer",
          }}>✕</div>
        </div>

        {/* Chat bubbles */}
        <div style={{ background: palette.linen, borderRadius: 16, padding: 18 }}>
          <div style={{
            background: "#fff",
            borderRadius: "14px 14px 14px 4px",
            padding: "10px 14px",
            maxWidth: "75%",
            marginBottom: 8,
            border: `1px solid ${palette.cream}`,
          }}>
            <span style={{ fontSize: 14, color: palette.espresso }}>Hey, want to cowork today?</span>
          </div>
          <div style={{
            background: palette.espresso,
            borderRadius: "14px 14px 4px 14px",
            padding: "10px 14px",
            maxWidth: "75%",
            marginLeft: "auto",
          }}>
            <span style={{ fontSize: 14, color: palette.parchment }}>Sure! I'll be at the café by 2pm ☕</span>
          </div>
          <p style={{ textAlign: "right", fontSize: 11, color: palette.stone, margin: "6px 0 0" }}>2:15 PM</p>
        </div>

      </div>
    </div>
  );
}

function SectionLabel({ children, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: "#EDE7DF" }} />
    </div>
  );
}

function Row({ label, old, next, note }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
      <span style={{ width: 120, color: "#7A6654" }}>{label}</span>
      <span style={{ color: "#B8AFA4", textDecoration: "line-through" }}>{old}</span>
      <span style={{ color: "#4A3C30" }}>→</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 12, height: 12, borderRadius: 3, background: next, border: "1px solid rgba(0,0,0,0.06)" }} />
        <span style={{ color: "#4A3C30", fontWeight: 600 }}>{next}</span>
      </div>
      {note && <span style={{ color: "#B8AFA4", fontSize: 10, fontStyle: "italic" }}>({note})</span>}
    </div>
  );
}

import { useState } from "react";

const palette = {
  parchment: "#FAF6F1",
  linen: "#F6F1EB",
  cream: "#EDE7DF",
  espresso: "#4A3C30",
  walnut: "#7A6654",
  driftwood: "#A8927B",
  stone: "#B8AFA4",
  fog: "#D6D0C8",
  honey: "#C9A86C",
  terracotta: "#C4735A",
  blush: "#D4A49A",
};

// Glass card component
function Glass({ children, style = {}, blur = 16, opacity = 0.45, borderOpacity = 0.25, ...props }) {
  return (
    <div
      style={{
        background: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
        borderRadius: 20,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export default function GlassmorphismDiscover() {
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
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 20px) scale(1.08); }
          66% { transform: translate(15px, -25px) scale(0.97); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, 30px) scale(1.03); }
        }
      `}</style>

      {/* Warm gradient background */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: `linear-gradient(145deg, ${palette.parchment} 0%, ${palette.linen} 30%, ${palette.cream} 60%, #E8DDD3 100%)`,
      }} />

      {/* Floating ambient blobs */}
      <div style={{
        position: "fixed",
        width: 280,
        height: 280,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${palette.blush}40, ${palette.blush}00)`,
        top: -40,
        right: -60,
        animation: "float1 12s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed",
        width: 220,
        height: 220,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${palette.honey}30, ${palette.honey}00)`,
        bottom: 60,
        left: -40,
        animation: "float2 15s ease-in-out infinite",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed",
        width: 180,
        height: 180,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${palette.driftwood}20, ${palette.driftwood}00)`,
        top: "40%",
        right: "20%",
        animation: "float3 10s ease-in-out infinite",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: 400,
        margin: "0 auto",
        padding: "52px 22px 140px",
      }}>
        {/* Header */}
        <p style={{ margin: "0 0 4px", fontSize: 13, color: palette.driftwood, fontWeight: 500 }}>
          Set availability to connect
        </p>
        <h1 style={{
          margin: "0 0 24px",
          fontSize: 28,
          fontWeight: 700,
          color: palette.espresso,
          lineHeight: 1.2,
          letterSpacing: -0.5,
        }}>
          Today's focus
        </h1>

        {/* Task input — glass */}
        <Glass
          opacity={0.5}
          blur={20}
          style={{
            padding: "3px",
            borderRadius: 14,
            marginBottom: 16,
            border: inputFocused
              ? `1.5px solid rgba(74, 60, 48, 0.25)`
              : `1px solid rgba(255, 255, 255, 0.35)`,
            boxShadow: inputFocused
              ? "0 0 0 3px rgba(74, 60, 48, 0.06), 0 4px 16px rgba(74, 60, 48, 0.06)"
              : "0 2px 8px rgba(74, 60, 48, 0.04)",
            transition: "all 0.2s ease",
          }}
        >
          <input
            type="text"
            placeholder="e.g., Writing a blog post"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              width: "100%",
              padding: "13px 16px",
              background: "transparent",
              border: "none",
              borderRadius: 11,
              fontSize: 15,
              color: palette.espresso,
              fontFamily: "inherit",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </Glass>

        {/* Vibe + Location — glass card */}
        <Glass
          opacity={0.45}
          blur={20}
          borderOpacity={0.3}
          style={{
            padding: "20px 18px",
            marginBottom: 16,
            boxShadow: "0 4px 24px rgba(74, 60, 48, 0.06), 0 1px 2px rgba(74, 60, 48, 0.04)",
          }}
        >
          {/* Work vibe */}
          <p style={{ fontSize: 13, fontWeight: 600, color: palette.espresso, margin: "0 0 10px" }}>
            Work vibe
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
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
                    border: sel
                      ? `1.5px solid ${palette.espresso}`
                      : "1px solid rgba(255,255,255,0.4)",
                    background: sel
                      ? palette.espresso
                      : "rgba(255, 255, 255, 0.4)",
                    backdropFilter: sel ? "none" : "blur(8px)",
                    WebkitBackdropFilter: sel ? "none" : "blur(8px)",
                    color: sel ? palette.parchment : palette.walnut,
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                    boxShadow: sel
                      ? "0 2px 8px rgba(74,60,48,0.2)"
                      : "0 1px 4px rgba(74,60,48,0.04)",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{v.emoji}</span>
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
            margin: "0 -18px 18px",
          }} />

          {/* Where */}
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
                    border: sel
                      ? `1.5px solid ${palette.espresso}`
                      : "1px solid rgba(255,255,255,0.4)",
                    background: sel
                      ? palette.espresso
                      : "rgba(255, 255, 255, 0.4)",
                    backdropFilter: sel ? "none" : "blur(8px)",
                    WebkitBackdropFilter: sel ? "none" : "blur(8px)",
                    color: sel ? palette.parchment : palette.walnut,
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                    boxShadow: sel
                      ? "0 2px 8px rgba(74,60,48,0.2)"
                      : "0 1px 4px rgba(74,60,48,0.04)",
                  }}
                >
                  <span style={{ fontSize: 14 }}>{l.emoji}</span>
                  {l.label}
                </button>
              );
            })}
          </div>
        </Glass>

        {/* Available — glass */}
        <div style={{ marginBottom: 16 }}>
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 1,
            color: palette.driftwood,
            margin: "0 0 8px",
          }}>
            Available
          </p>
          <Glass
            opacity={0.5}
            blur={20}
            style={{
              padding: "13px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 14,
              boxShadow: "0 2px 8px rgba(74, 60, 48, 0.04)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={palette.stone} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 600, color: palette.espresso }}>11:30 AM</span>
            <span style={{ color: palette.fog }}>—</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: palette.espresso }}>1:30 PM</span>
            <Glass
              opacity={0.5}
              blur={8}
              style={{
                marginLeft: "auto",
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
                color: palette.walnut,
              }}
            >
              2h
            </Glass>
          </Glass>
        </div>

        {/* Add specific place */}
        <button
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "transparent",
            border: "1.5px dashed rgba(184, 175, 164, 0.5)",
            borderRadius: 14,
            fontSize: 13,
            color: palette.stone,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            transition: "all 0.15s ease",
          }}
        >
          + Add a specific place <span style={{ color: palette.fog }}>(optional)</span>
        </button>
      </div>

      {/* Sticky CTA — glass bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      }}>
        <div style={{
          background: "rgba(246, 241, 235, 0.7)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid rgba(255,255,255,0.4)",
          padding: "14px 22px 34px",
        }}>
          <button
            style={{
              width: "100%",
              maxWidth: 400,
              margin: "0 auto",
              display: "block",
              padding: "15px 0",
              background: palette.espresso,
              border: "none",
              borderRadius: 14,
              color: palette.parchment,
              fontSize: 15.5,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: 0.2,
              boxShadow: "0 4px 20px rgba(74, 60, 48, 0.25), 0 2px 6px rgba(74, 60, 48, 0.15)",
              transition: "all 0.15s ease",
            }}
          >
            Find Co-Workers
          </button>
        </div>
      </div>

      {/* Bottom nav — glass */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 5,
      }}>
      </div>
    </div>
  );
}

import { useState } from "react";

// Design tokens
const t = {
  bgPrimary: "#FAFAF8",
  bgSecondary: "#F4F3F0",
  bgCard: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#6B6B6B",
  textTertiary: "#9B9B9B",
  textInverse: "#FFFFFF",
  borderDefault: "#E8E8E4",
  borderFocus: "#3D3D3D",
  divider: "#F0EFEC",
  accentPrimary: "#3D3D3D",
  accentHover: "#2A2A2A",
  accentSuccess: "#4A7A5B",
  accentWarning: "#C4973B",
  accentDanger: "#B85C4D",
  accentSubtle: "#EAEAE6",
  statusPendingBg: "#FDF6E8",
  statusPendingText: "#C4973B",
  statusConfirmedBg: "#EDF5EF",
  statusConfirmedText: "#4A7A5B",
  statusCancelledBg: "#F5F4F2",
  statusCancelledText: "#9B9B9B",
};

const Swatch = ({ color, label, dark }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: 10,
        background: color,
        border: color === "#FFFFFF" || color === "#FAFAF8" ? `1px solid ${t.borderDefault}` : "none",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    />
    <span style={{ fontSize: 10, fontWeight: 600, color: t.textTertiary, fontFamily: "monospace" }}>
      {color}
    </span>
    <span style={{ fontSize: 10, color: t.textTertiary }}>{label}</span>
  </div>
);

export default function DesignSystemReference() {
  const [selectedChip, setSelectedChip] = useState("Flexible");
  const [selectedLoc, setSelectedLoc] = useState("Anywhere");
  const [inputFocused, setInputFocused] = useState(false);
  const [selectedDate, setSelectedDate] = useState(0);

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
  const dates = [
    { day: "Today", date: "Feb 14" },
    { day: "Sat", date: "Feb 15" },
    { day: "Sun", date: "Feb 16" },
    { day: "Mon", date: "Feb 17" },
    { day: "Tue", date: "Feb 18" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: t.bgPrimary, fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "40px 24px 60px" }}>
        {/* Title */}
        <h1 style={{ fontSize: 28, fontWeight: 700, color: t.textPrimary, margin: "0 0 4px", letterSpacing: -0.3 }}>
          Cowork — Design System
        </h1>
        <p style={{ fontSize: 14, color: t.textTertiary, margin: "0 0 40px" }}>
          v1.0 · Warm neutral · Productive & sharp
        </p>

        {/* ── COLORS ── */}
        <SectionLabel>Colors</SectionLabel>

        <p style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, margin: "0 0 12px" }}>Base</p>
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <Swatch color={t.bgPrimary} label="bg-primary" />
          <Swatch color={t.bgSecondary} label="bg-secondary" />
          <Swatch color={t.bgCard} label="bg-card" />
          <Swatch color={t.borderDefault} label="border" />
        </div>

        <p style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, margin: "0 0 12px" }}>Text</p>
        <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
          <Swatch color={t.textPrimary} label="primary" />
          <Swatch color={t.textSecondary} label="secondary" />
          <Swatch color={t.textTertiary} label="tertiary" />
        </div>

        <p style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, margin: "0 0 12px" }}>Accent & Status</p>
        <div style={{ display: "flex", gap: 16, marginBottom: 40, flexWrap: "wrap" }}>
          <Swatch color={t.accentPrimary} label="primary" />
          <Swatch color={t.accentSuccess} label="success" />
          <Swatch color={t.accentWarning} label="warning" />
          <Swatch color={t.accentDanger} label="danger" />
        </div>

        {/* ── TYPOGRAPHY ── */}
        <SectionLabel>Typography</SectionLabel>
        <div style={{ background: t.bgCard, borderRadius: 16, padding: 20, boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)", marginBottom: 40 }}>
          <p style={{ fontSize: 26, fontWeight: 700, color: t.textPrimary, margin: "0 0 8px", letterSpacing: -0.3 }}>
            Heading XL — 26/700
          </p>
          <p style={{ fontSize: 20, fontWeight: 700, color: t.textPrimary, margin: "0 0 8px", letterSpacing: -0.2 }}>
            Heading LG — 20/700
          </p>
          <p style={{ fontSize: 16, fontWeight: 600, color: t.textPrimary, margin: "0 0 8px" }}>
            Heading MD — 16/600
          </p>
          <p style={{ fontSize: 15, fontWeight: 400, color: t.textSecondary, margin: "0 0 8px" }}>
            Body — 15/400 — Secondary color for descriptions
          </p>
          <p style={{ fontSize: 13, fontWeight: 400, color: t.textSecondary, margin: "0 0 8px" }}>
            Body Small — 13/400 — For captions and metadata
          </p>
          <p style={{ fontSize: 11, fontWeight: 600, color: t.textTertiary, margin: 0, textTransform: "uppercase", letterSpacing: 0.8 }}>
            Caption — 11/600 — Labels & badges
          </p>
        </div>

        {/* ── COMPONENTS ── */}
        <SectionLabel>Components</SectionLabel>

        {/* Chips */}
        <ComponentLabel>Chips — Work Vibe</ComponentLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {vibes.map((v) => (
            <Chip
              key={v.label}
              label={v.label}
              emoji={v.emoji}
              selected={v.label === selectedChip}
              onClick={() => setSelectedChip(v.label)}
            />
          ))}
        </div>

        <ComponentLabel>Chips — Location</ComponentLabel>
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          {locs.map((l) => (
            <Chip
              key={l.label}
              label={l.label}
              emoji={l.emoji}
              selected={l.label === selectedLoc}
              onClick={() => setSelectedLoc(l.label)}
            />
          ))}
        </div>

        {/* Input */}
        <ComponentLabel>Input Field</ComponentLabel>
        <input
          type="text"
          placeholder="e.g., Writing a blog post"
          style={{
            width: "100%",
            padding: "13px 16px",
            background: t.bgCard,
            border: `1.5px solid ${inputFocused ? t.borderFocus : t.borderDefault}`,
            borderRadius: 12,
            fontSize: 15,
            color: t.textPrimary,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            transition: "all 0.15s ease",
            boxShadow: inputFocused ? "0 0 0 3px rgba(61,61,61,0.06)" : "none",
            marginBottom: 32,
          }}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />

        {/* Buttons */}
        <ComponentLabel>Buttons</ComponentLabel>
        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <button
            style={{
              flex: 1,
              padding: "14px 0",
              background: t.accentPrimary,
              border: "none",
              borderRadius: 12,
              color: t.textInverse,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: "0 2px 6px rgba(61,61,61,0.15), 0 4px 16px rgba(61,61,61,0.08)",
            }}
          >
            Primary CTA
          </button>
          <button
            style={{
              padding: "14px 24px",
              background: "transparent",
              border: `1.5px solid ${t.borderDefault}`,
              borderRadius: 12,
              color: t.textSecondary,
              fontSize: 15,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Secondary
          </button>
          <button
            style={{
              padding: "14px 20px",
              background: "transparent",
              border: "none",
              color: t.textTertiary,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Ghost
          </button>
        </div>

        {/* Status Badges */}
        <ComponentLabel>Status Badges</ComponentLabel>
        <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
          <Badge bg={t.statusPendingBg} color={t.statusPendingText}>Pending</Badge>
          <Badge bg={t.statusConfirmedBg} color={t.statusConfirmedText}>Confirmed</Badge>
          <Badge bg={t.statusCancelledBg} color={t.statusCancelledText}>Cancelled</Badge>
        </div>

        {/* Inline Time */}
        <ComponentLabel>Inline Time Display</ComponentLabel>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: t.bgCard,
            borderRadius: 12,
            padding: "13px 16px",
            border: `1.5px solid ${t.borderDefault}`,
            marginBottom: 32,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.textTertiary} strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary }}>11:30 AM</span>
          <span style={{ color: "#CCC", fontSize: 12 }}>—</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary }}>1:30 PM</span>
          <span style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 600,
            color: t.textSecondary,
            background: t.accentSubtle,
            padding: "3px 9px",
            borderRadius: 20,
          }}>2h</span>
        </div>

        {/* Date Pills */}
        <ComponentLabel>Date Pill Selector</ComponentLabel>
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {dates.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelectedDate(i)}
              style={{
                width: 54,
                padding: "10px 4px",
                borderRadius: 12,
                border: i === selectedDate ? `1.5px solid ${t.accentPrimary}` : `1.5px solid ${t.borderDefault}`,
                background: i === selectedDate ? t.accentPrimary : t.bgPrimary,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: i === selectedDate ? t.textInverse : t.textPrimary }}>
                {d.day}
              </span>
              <span style={{ fontSize: 10, color: i === selectedDate ? "rgba(255,255,255,0.6)" : t.textTertiary }}>
                {d.date}
              </span>
            </button>
          ))}
        </div>

        {/* Pending Invite Card */}
        <ComponentLabel>Pending Invite Card</ComponentLabel>
        <div
          style={{
            background: t.bgCard,
            borderRadius: 16,
            padding: "14px 16px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: t.statusPendingBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.accentWarning} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: t.textPrimary }}>Cowork Invite</span>
              <Badge bg={t.statusPendingBg} color={t.statusPendingText}>Pending</Badge>
            </div>
            <span style={{ fontSize: 12.5, color: t.textTertiary }}>Fri, Feb 14</span>
          </div>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 30,
              background: t.bgSecondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              cursor: "pointer",
              color: t.textTertiary,
              fontSize: 14,
            }}
          >
            ✕
          </div>
        </div>

        {/* Card Example */}
        <ComponentLabel>Grouped Card (Vibe + Location)</ComponentLabel>
        <div
          style={{
            background: t.bgCard,
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)",
            marginBottom: 32,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, margin: "0 0 10px" }}>Work vibe</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {vibes.map((v) => (
              <Chip key={v.label} label={v.label} emoji={v.emoji} selected={v.label === selectedChip} onClick={() => setSelectedChip(v.label)} />
            ))}
          </div>
          <div style={{ height: 1, background: t.divider, margin: "0 -18px 16px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary, margin: "0 0 10px" }}>Where</p>
          <div style={{ display: "flex", gap: 8 }}>
            {locs.map((l) => (
              <Chip key={l.label} label={l.label} emoji={l.emoji} selected={l.label === selectedLoc} onClick={() => setSelectedLoc(l.label)} />
            ))}
          </div>
        </div>

        {/* Chat Bubbles */}
        <ComponentLabel>Chat Bubbles</ComponentLabel>
        <div style={{ background: t.bgSecondary, borderRadius: 16, padding: 18, marginBottom: 32 }}>
          <div style={{
            background: t.bgCard,
            borderRadius: "14px 14px 14px 4px",
            padding: "10px 14px",
            maxWidth: "75%",
            marginBottom: 8,
            border: `1px solid ${t.borderDefault}`,
          }}>
            <span style={{ fontSize: 14, color: t.textPrimary }}>Hey, want to cowork today?</span>
          </div>
          <div style={{
            background: t.accentPrimary,
            borderRadius: "14px 14px 4px 14px",
            padding: "10px 14px",
            maxWidth: "75%",
            marginLeft: "auto",
            marginBottom: 8,
          }}>
            <span style={{ fontSize: 14, color: t.textInverse }}>Sure! I'll be at the café by 2pm</span>
          </div>
          <p style={{ textAlign: "right", fontSize: 11, color: t.textTertiary, margin: "4px 0 0" }}>2:15 PM</p>
        </div>

      </div>
    </div>
  );
}

// Shared components
function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.2, color: "#9B9B9B" }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: "#E8E8E4" }} />
    </div>
  );
}

function ComponentLabel({ children }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", margin: "0 0 10px" }}>{children}</p>
  );
}

function Chip({ label, emoji, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "10px 6px",
        borderRadius: 12,
        border: `1.5px solid ${selected ? "#3D3D3D" : "#E8E8E4"}`,
        background: selected ? "#3D3D3D" : "transparent",
        color: selected ? "#FFFFFF" : "#6B6B6B",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: 14 }}>{emoji}</span>
      {label}
    </button>
  );
}

function Badge({ bg, color, children }) {
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      color,
      background: bg,
      padding: "3px 10px",
      borderRadius: 999,
    }}>
      {children}
    </span>
  );
}

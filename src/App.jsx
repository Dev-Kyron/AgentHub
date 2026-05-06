import { useState, useEffect, useRef } from "react";
import logo from "./assets/logo.png";
import bg from "./assets/bg.png";
import bgOrange from "./assets/bg_orange.png";
import bgCctx from "./assets/CCTX_Blue.png";

/* ─────────────────────────────────────────────
   STORAGE MIGRATION
───────────────────────────────────────────── */
const SECTION_DEFS = [
  { id: "sod", defaultTitle: "Start of Day", legacyKey: "tools-Start of Day" },
  { id: "md",  defaultTitle: "Main Day",     legacyKey: "tools-Main Day"     },
  { id: "eod", defaultTitle: "End of Day",   legacyKey: "tools-End of Day"   },
];
(function migrateStorage() {
  SECTION_DEFS.forEach(({ id, legacyKey }) => {
    const newKey = `tools-${id}`;
    if (!localStorage.getItem(newKey)) {
      const old = localStorage.getItem(legacyKey);
      if (old) localStorage.setItem(newKey, old);
    }
  });
})();

/* ─────────────────────────────────────────────
   CALENDAR HELPERS  — rolling 7-day real dates
───────────────────────────────────────────── */
function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function getRollingWeek() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i); return d;
  });
}
function dateFromKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function formatDate(date) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DAY_ABBR  = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/* ─────────────────────────────────────────────
   ENCODE / DECODE
───────────────────────────────────────────── */
function packData(d) {
  return { s: d.sod, m: d.md, e: d.eod, t: d.titles, n: d.notes, c: d.schedule, x: d.themeId };
}
function unpackData(p) {
  return {
    sod:      p.s ?? p.sod      ?? [],
    md:       p.m ?? p.md       ?? [],
    eod:      p.e ?? p.eod      ?? [],
    titles:   p.t ?? p.titles   ?? null,
    notes:    p.n ?? p.notes    ?? "",
    schedule: p.c ?? p.schedule ?? {},
    themeId:  p.x ?? p.themeId  ?? "concentrix",
  };
}

async function encodeData(data) {
  const json  = JSON.stringify(packData(data));
  try {
    const bytes  = new TextEncoder().encode(json);
    const cs     = new CompressionStream("deflate-raw");
    const writer = cs.writable.getWriter();
    writer.write(bytes); writer.close();
    const buf = await new Response(cs.readable).arrayBuffer();
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  } catch {
    return btoa(unescape(encodeURIComponent(json))).replace(/=/g, "");
  }
}

async function decodeData(input) {
  const raw  = input.includes("#key=") ? input.split("#key=").pop().trim() : input.trim();
  const b64  = raw.replace(/-/g, "+").replace(/_/g, "/");
  const pad  = (4 - (b64.length % 4)) % 4;
  const b64p = b64 + "=".repeat(pad);
  try {
    const bytes  = Uint8Array.from(atob(b64p), (c) => c.charCodeAt(0));
    const ds     = new DecompressionStream("deflate-raw");
    const writer = ds.writable.getWriter();
    writer.write(bytes); writer.close();
    const buf  = await new Response(ds.readable).arrayBuffer();
    const json = new TextDecoder().decode(buf);
    return unpackData(JSON.parse(json));
  } catch {
    try { return unpackData(JSON.parse(decodeURIComponent(escape(atob(b64p))))); }
    catch { return null; }
  }
}

function buildShareUrl(key) {
  return `${window.location.origin}${window.location.pathname}#key=${key}`;
}

/* ─────────────────────────────────────────────
   AUTO-SNAPSHOT
   Saves a plain JSON copy of all user data to
   "agenthub_snapshot". Runs on mount, every 60s,
   and on page unload. Because it stores raw strings
   (already-serialised localStorage values) it
   survives any future compression format changes.
───────────────────────────────────────────── */
const SNAPSHOT_KEY = "agenthub_snapshot";

function saveSnapshot() {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
      sod:    localStorage.getItem("tools-sod"),
      md:     localStorage.getItem("tools-md"),
      eod:    localStorage.getItem("tools-eod"),
      notes:  localStorage.getItem("notes"),
      sched:  localStorage.getItem("schedule"),
      titles: localStorage.getItem("section-titles"),
      theme:  localStorage.getItem("themeId"),
      at:     Date.now(),
    }));
  } catch { /* storage full — silently skip */ }
}

function readSnapshot() {
  try { return JSON.parse(localStorage.getItem(SNAPSHOT_KEY)); } catch { return null; }
}

function restoreSnapshot(snap) {
  if (snap.sod)    localStorage.setItem("tools-sod",      snap.sod);
  if (snap.md)     localStorage.setItem("tools-md",       snap.md);
  if (snap.eod)    localStorage.setItem("tools-eod",      snap.eod);
  if (snap.notes !== null) localStorage.setItem("notes",  snap.notes ?? "");
  if (snap.sched)  localStorage.setItem("schedule",       snap.sched);
  if (snap.titles) localStorage.setItem("section-titles", snap.titles);
  if (snap.theme)  localStorage.setItem("themeId",        snap.theme);
  location.reload();
}

/* ─────────────────────────────────────────────
   THEMES
───────────────────────────────────────────── */
const THEMES = [
  {
    id: "concentrix", name: "Cyan", hex: "#1D50A0",
    hueRotate: 0, grayscale: 0, bg: "cyan",
    vars: {
      "--brand": "#1D50A0", "--brand-light": "#5b8dd9", "--brand-dim": "#0a1f3d",
      "--brand-glow": "rgba(29,80,160,0.60)", "--brand-ring": "rgba(91,141,217,0.85)",
      "--brand-border": "rgba(29,80,160,0.45)", "--brand-bg": "rgba(29,80,160,0.10)",
      "--brand-hover-bg": "rgba(29,80,160,0.22)", "--text-primary": "#bfdbfe",
      "--text-secondary": "rgba(147,197,253,0.75)", "--text-muted": "rgba(147,197,253,0.45)",
      "--card-border": "rgba(29,80,160,0.40)", "--card-bg": "rgba(0,0,0,0.42)",
      "--overlay": "rgba(0,3,12,0.45)", "--btn-primary-bg": "rgba(15,52,120,0.72)",
      "--btn-primary-hover": "rgba(29,80,160,0.88)",
    },
  },
  {
    id: "orange", name: "Orange", hex: "#e85d04",
    hueRotate: 0, grayscale: 0, bg: "orange",
    vars: {
      "--brand": "#e85d04", "--brand-light": "#fb8c00", "--brand-dim": "#7c2d00",
      "--brand-glow": "rgba(232,93,4,0.60)", "--brand-ring": "rgba(251,140,0,0.85)",
      "--brand-border": "rgba(232,93,4,0.45)", "--brand-bg": "rgba(232,93,4,0.10)",
      "--brand-hover-bg": "rgba(232,93,4,0.22)", "--text-primary": "#fed7aa",
      "--text-secondary": "rgba(253,186,116,0.75)", "--text-muted": "rgba(253,186,116,0.45)",
      "--card-border": "rgba(194,65,12,0.40)", "--card-bg": "rgba(0,0,0,0.42)",
      "--overlay": "rgba(10,3,0,0.42)", "--btn-primary-bg": "rgba(194,65,12,0.72)",
      "--btn-primary-hover": "rgba(234,88,12,0.88)",
    },
  },
  {
    id: "purple", name: "Purple", hex: "#7c3aed",
    hueRotate: 0, grayscale: 0, bg: null,
    vars: {
      "--brand": "#7c3aed", "--brand-light": "#a78bfa", "--brand-dim": "#4c1d95",
      "--brand-glow": "rgba(124,58,237,0.55)", "--brand-ring": "rgba(168,85,247,0.8)",
      "--brand-border": "rgba(124,58,237,0.4)", "--brand-bg": "rgba(124,58,237,0.08)",
      "--brand-hover-bg": "rgba(124,58,237,0.18)", "--text-primary": "#e9d5ff",
      "--text-secondary": "rgba(216,180,254,0.7)", "--text-muted": "rgba(196,167,255,0.45)",
      "--card-border": "rgba(109,40,217,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(0,0,0,0.38)", "--btn-primary-bg": "rgba(109,40,217,0.70)",
      "--btn-primary-hover": "rgba(124,58,237,0.85)",
    },
  },
  {
    id: "blue", name: "Blue", hex: "#1a56c4",
    hueRotate: 175, grayscale: 0, bg: null,
    vars: {
      "--brand": "#1a56c4", "--brand-light": "#60a5fa", "--brand-dim": "#1e3a8a",
      "--brand-glow": "rgba(26,86,196,0.55)", "--brand-ring": "rgba(59,130,246,0.8)",
      "--brand-border": "rgba(26,86,196,0.4)", "--brand-bg": "rgba(26,86,196,0.08)",
      "--brand-hover-bg": "rgba(26,86,196,0.18)", "--text-primary": "#bfdbfe",
      "--text-secondary": "rgba(147,197,253,0.7)", "--text-muted": "rgba(147,197,253,0.45)",
      "--card-border": "rgba(30,64,175,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(0,0,10,0.40)", "--btn-primary-bg": "rgba(30,64,175,0.70)",
      "--btn-primary-hover": "rgba(26,86,196,0.85)",
    },
  },
  {
    id: "red", name: "Red", hex: "#dc2626",
    hueRotate: 130, grayscale: 0, bg: null,
    vars: {
      "--brand": "#dc2626", "--brand-light": "#f87171", "--brand-dim": "#7f1d1d",
      "--brand-glow": "rgba(220,38,38,0.55)", "--brand-ring": "rgba(248,113,113,0.8)",
      "--brand-border": "rgba(220,38,38,0.4)", "--brand-bg": "rgba(220,38,38,0.08)",
      "--brand-hover-bg": "rgba(220,38,38,0.18)", "--text-primary": "#fecaca",
      "--text-secondary": "rgba(252,165,165,0.7)", "--text-muted": "rgba(252,165,165,0.45)",
      "--card-border": "rgba(185,28,28,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(10,0,0,0.40)", "--btn-primary-bg": "rgba(185,28,28,0.70)",
      "--btn-primary-hover": "rgba(220,38,38,0.85)",
    },
  },
  {
    id: "pink", name: "Pink", hex: "#db2777",
    hueRotate: 315, grayscale: 0, bg: null,
    vars: {
      "--brand": "#db2777", "--brand-light": "#f472b6", "--brand-dim": "#831843",
      "--brand-glow": "rgba(219,39,119,0.55)", "--brand-ring": "rgba(244,114,182,0.8)",
      "--brand-border": "rgba(219,39,119,0.4)", "--brand-bg": "rgba(219,39,119,0.08)",
      "--brand-hover-bg": "rgba(219,39,119,0.18)", "--text-primary": "#fbcfe8",
      "--text-secondary": "rgba(249,168,212,0.7)", "--text-muted": "rgba(249,168,212,0.45)",
      "--card-border": "rgba(190,24,93,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(8,0,4,0.40)", "--btn-primary-bg": "rgba(190,24,93,0.70)",
      "--btn-primary-hover": "rgba(219,39,119,0.85)",
    },
  },
  {
    id: "bw", name: "B & W", hex: "#6b7280",
    hueRotate: 0, grayscale: 1, bg: null,
    vars: {
      "--brand": "#9ca3af", "--brand-light": "#e5e7eb", "--brand-dim": "#374151",
      "--brand-glow": "rgba(156,163,175,0.40)", "--brand-ring": "rgba(209,213,219,0.7)",
      "--brand-border": "rgba(107,114,128,0.35)", "--brand-bg": "rgba(255,255,255,0.05)",
      "--brand-hover-bg": "rgba(255,255,255,0.12)", "--text-primary": "#f3f4f6",
      "--text-secondary": "rgba(209,213,219,0.70)", "--text-muted": "rgba(156,163,175,0.50)",
      "--card-border": "rgba(75,85,99,0.40)", "--card-bg": "rgba(0,0,0,0.45)",
      "--overlay": "rgba(0,0,0,0.42)", "--btn-primary-bg": "rgba(55,65,81,0.72)",
      "--btn-primary-hover": "rgba(75,85,99,0.88)",
    },
  },
  /* ── New themes ── */
  {
    id: "green", name: "Green", hex: "#16a34a",
    hueRotate: 90, grayscale: 0, bg: null,
    vars: {
      "--brand": "#16a34a", "--brand-light": "#4ade80", "--brand-dim": "#14532d",
      "--brand-glow": "rgba(22,163,74,0.55)", "--brand-ring": "rgba(74,222,128,0.8)",
      "--brand-border": "rgba(22,163,74,0.4)", "--brand-bg": "rgba(22,163,74,0.08)",
      "--brand-hover-bg": "rgba(22,163,74,0.18)", "--text-primary": "#bbf7d0",
      "--text-secondary": "rgba(134,239,172,0.7)", "--text-muted": "rgba(134,239,172,0.45)",
      "--card-border": "rgba(21,128,61,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(0,5,0,0.40)", "--btn-primary-bg": "rgba(21,128,61,0.70)",
      "--btn-primary-hover": "rgba(22,163,74,0.85)",
    },
  },
  {
    id: "teal", name: "Teal", hex: "#0d9488",
    hueRotate: 155, grayscale: 0, bg: null,
    vars: {
      "--brand": "#0d9488", "--brand-light": "#2dd4bf", "--brand-dim": "#134e4a",
      "--brand-glow": "rgba(13,148,136,0.55)", "--brand-ring": "rgba(45,212,191,0.8)",
      "--brand-border": "rgba(13,148,136,0.4)", "--brand-bg": "rgba(13,148,136,0.08)",
      "--brand-hover-bg": "rgba(13,148,136,0.18)", "--text-primary": "#99f6e4",
      "--text-secondary": "rgba(153,246,228,0.7)", "--text-muted": "rgba(153,246,228,0.45)",
      "--card-border": "rgba(15,118,110,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(0,4,4,0.40)", "--btn-primary-bg": "rgba(15,118,110,0.70)",
      "--btn-primary-hover": "rgba(13,148,136,0.85)",
    },
  },
  {
    id: "sky", name: "Sky", hex: "#0284c7",
    hueRotate: 170, grayscale: 0, bg: null,
    vars: {
      "--brand": "#0284c7", "--brand-light": "#38bdf8", "--brand-dim": "#0c4a6e",
      "--brand-glow": "rgba(2,132,199,0.55)", "--brand-ring": "rgba(56,189,248,0.8)",
      "--brand-border": "rgba(2,132,199,0.4)", "--brand-bg": "rgba(2,132,199,0.08)",
      "--brand-hover-bg": "rgba(2,132,199,0.18)", "--text-primary": "#bae6fd",
      "--text-secondary": "rgba(186,230,253,0.7)", "--text-muted": "rgba(186,230,253,0.45)",
      "--card-border": "rgba(3,105,161,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(0,2,8,0.40)", "--btn-primary-bg": "rgba(3,105,161,0.70)",
      "--btn-primary-hover": "rgba(2,132,199,0.85)",
    },
  },
  {
    id: "amber", name: "Amber", hex: "#d97706",
    hueRotate: 25, grayscale: 0, bg: null,
    vars: {
      "--brand": "#d97706", "--brand-light": "#fcd34d", "--brand-dim": "#78350f",
      "--brand-glow": "rgba(217,119,6,0.55)", "--brand-ring": "rgba(252,211,77,0.8)",
      "--brand-border": "rgba(217,119,6,0.4)", "--brand-bg": "rgba(217,119,6,0.08)",
      "--brand-hover-bg": "rgba(217,119,6,0.18)", "--text-primary": "#fef3c7",
      "--text-secondary": "rgba(253,230,138,0.7)", "--text-muted": "rgba(253,230,138,0.45)",
      "--card-border": "rgba(180,83,9,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(6,3,0,0.40)", "--btn-primary-bg": "rgba(180,83,9,0.70)",
      "--btn-primary-hover": "rgba(217,119,6,0.85)",
    },
  },
  {
    id: "indigo", name: "Indigo", hex: "#4338ca",
    hueRotate: 195, grayscale: 0, bg: null,
    vars: {
      "--brand": "#4338ca", "--brand-light": "#818cf8", "--brand-dim": "#1e1b4b",
      "--brand-glow": "rgba(67,56,202,0.55)", "--brand-ring": "rgba(129,140,248,0.8)",
      "--brand-border": "rgba(67,56,202,0.4)", "--brand-bg": "rgba(67,56,202,0.08)",
      "--brand-hover-bg": "rgba(67,56,202,0.18)", "--text-primary": "#e0e7ff",
      "--text-secondary": "rgba(199,210,254,0.7)", "--text-muted": "rgba(199,210,254,0.45)",
      "--card-border": "rgba(55,48,163,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(0,0,8,0.40)", "--btn-primary-bg": "rgba(55,48,163,0.70)",
      "--btn-primary-hover": "rgba(67,56,202,0.85)",
    },
  },
  {
    id: "lime", name: "Lime", hex: "#65a30d",
    hueRotate: 65, grayscale: 0, bg: null,
    vars: {
      "--brand": "#65a30d", "--brand-light": "#a3e635", "--brand-dim": "#365314",
      "--brand-glow": "rgba(101,163,13,0.55)", "--brand-ring": "rgba(163,230,53,0.8)",
      "--brand-border": "rgba(101,163,13,0.4)", "--brand-bg": "rgba(101,163,13,0.08)",
      "--brand-hover-bg": "rgba(101,163,13,0.18)", "--text-primary": "#ecfccb",
      "--text-secondary": "rgba(217,249,157,0.7)", "--text-muted": "rgba(217,249,157,0.45)",
      "--card-border": "rgba(77,124,15,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(1,4,0,0.40)", "--btn-primary-bg": "rgba(77,124,15,0.70)",
      "--btn-primary-hover": "rgba(101,163,13,0.85)",
    },
  },
  {
    id: "rose", name: "Rose", hex: "#e11d48",
    hueRotate: 140, grayscale: 0, bg: null,
    vars: {
      "--brand": "#e11d48", "--brand-light": "#fb7185", "--brand-dim": "#881337",
      "--brand-glow": "rgba(225,29,72,0.55)", "--brand-ring": "rgba(251,113,133,0.8)",
      "--brand-border": "rgba(225,29,72,0.4)", "--brand-bg": "rgba(225,29,72,0.08)",
      "--brand-hover-bg": "rgba(225,29,72,0.18)", "--text-primary": "#ffe4e6",
      "--text-secondary": "rgba(254,205,211,0.7)", "--text-muted": "rgba(254,205,211,0.45)",
      "--card-border": "rgba(190,18,60,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(8,0,2,0.40)", "--btn-primary-bg": "rgba(190,18,60,0.70)",
      "--btn-primary-hover": "rgba(225,29,72,0.85)",
    },
  },
  {
    id: "violet", name: "Violet", hex: "#7c3aed",
    hueRotate: 210, grayscale: 0, bg: null,
    vars: {
      "--brand": "#6d28d9", "--brand-light": "#c4b5fd", "--brand-dim": "#2e1065",
      "--brand-glow": "rgba(109,40,217,0.55)", "--brand-ring": "rgba(196,181,253,0.8)",
      "--brand-border": "rgba(109,40,217,0.4)", "--brand-bg": "rgba(109,40,217,0.08)",
      "--brand-hover-bg": "rgba(109,40,217,0.18)", "--text-primary": "#ede9fe",
      "--text-secondary": "rgba(221,214,254,0.7)", "--text-muted": "rgba(221,214,254,0.45)",
      "--card-border": "rgba(91,33,182,0.35)", "--card-bg": "rgba(0,0,0,0.40)",
      "--overlay": "rgba(2,0,8,0.40)", "--btn-primary-bg": "rgba(91,33,182,0.70)",
      "--btn-primary-hover": "rgba(109,40,217,0.85)",
    },
  },
];

function applyTheme(theme) {
  Object.entries(theme.vars).forEach(([k, v]) =>
    document.documentElement.style.setProperty(k, v)
  );
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getFavicon(url) {
  try { return `${new URL(url).origin}/favicon.ico`; } catch { return null; }
}

/* ─────────────────────────────────────────────
   STYLE TOKENS
───────────────────────────────────────────── */
const glass       = "bg-[--card-bg] backdrop-blur-md border border-[--card-border] shadow-lg shadow-black/40";
const btnPrimary  = "bg-[--btn-primary-bg] hover:bg-[--btn-primary-hover] border border-[--brand-border] transition";
const btnGhost    = "bg-white/10 hover:bg-white/20 backdrop-blur border border-[--card-border] transition";
const tourRingCls = "ring-2 ring-[--brand-ring] ring-offset-1 ring-offset-black/10 shadow-[0_0_18px_var(--brand-glow)]";

/* ─────────────────────────────────────────────
   FAVICON ICON — handles load failure cleanly
───────────────────────────────────────────── */
function FaviconIcon({ url }) {
  const [failed, setFailed] = useState(false);
  const src = getFavicon(url);
  if (!src || failed) {
    return <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: "var(--brand-dim)" }} />;
  }
  return (
    <img src={src} alt="" className="w-4 h-4 rounded flex-shrink-0"
      onError={() => setFailed(true)} />
  );
}

/* ─────────────────────────────────────────────
   THEME PICKER
───────────────────────────────────────────── */
function ThemePicker({ themeId, setThemeId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 ${btnGhost} px-3 py-1 rounded-lg text-sm`}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: current.hex, display: "inline-block", flexShrink: 0 }} />
        <span className="text-[--text-primary]">Theme</span>
        <span style={{ fontSize: 9, opacity: 0.6 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className={`${glass} absolute top-full right-0 mt-2 p-3 rounded-2xl`} style={{ width: 240, zIndex: 100 }}>
          <div className="text-[--text-muted] text-xs font-semibold uppercase tracking-widest mb-2 px-1">Brand Colour</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
            {THEMES.map((t) => (
              <button key={t.id}
                onClick={() => { setThemeId(t.id); localStorage.setItem("themeId", t.id); setOpen(false); }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition ${
                  themeId === t.id
                    ? "bg-[--brand-hover-bg] border border-[--brand-ring] text-[--text-primary]"
                    : "bg-[--brand-bg] hover:bg-[--brand-hover-bg] border border-transparent text-[--text-secondary]"
                }`}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.hex, display: "inline-block", flexShrink: 0 }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOUR
───────────────────────────────────────────── */
const TOUR_STEPS = [
  { id: "header",        title: "👋 Welcome to AgentHub!", body: "A quick tour to get you started. Click Next to continue.", position: "bottom", align: "left" },
  { id: "start-of-day", title: "🌅 Start of Day",          body: "Add the links you open every morning — standup board, email, Slack. Drag to reorder. Click the pencil to rename the column.", position: "bottom", align: "left" },
  { id: "main-day",     title: "💼 Main Day",              body: "Your core tools — CRM, knowledge base, dashboards. These stay open across every call.", position: "bottom", align: "center" },
  { id: "end-of-day",   title: "🌙 End of Day",            body: "Wrap-up tools — reporting, time tracking, anything you close before logging off.", position: "bottom", align: "right" },
  { id: "boot-btn",     title: "⚡ Boot Up My Day",        body: "One click opens every tool in Start of Day and Main Day as new tabs — your shift launch pad.", position: "top", align: "left" },
  { id: "notes",        title: "📋 Scripts & Notes",       body: "A persistent scratchpad for call scripts, talking points or shift notes. Saves automatically.", position: "left", align: "center" },
  { id: "scheduler",    title: "📅 Shift Scheduler",       body: "Shows today + the next 6 days with real dates. Click any date to add reminders or follow-ups. Drag items to reorder them.", position: "left", align: "center" },
  { id: "share-btn",    title: "🔗 Share / Backup",        body: "Generates a short compressed code — paste it on any machine to restore your full setup instantly.", position: "bottom", align: "right" },
  { id: "tour-btn",     title: "🎉 That's everything!",    body: "Replay this tour any time with the ? button. Happy hustling!", position: "bottom", align: "right" },
];

function TourTooltip({ step, stepIndex, total, onNext, onPrev, onClose, targetRef }) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tipRef = useRef(null);
  useEffect(() => {
    if (!targetRef?.current) return;
    const update = () => {
      const r = targetRef.current.getBoundingClientRect();
      const tH = tipRef.current?.offsetHeight || 160, tW = tipRef.current?.offsetWidth || 300, gap = 14;
      const a = step.align || "center";
      let top, left;
      if      (step.position === "bottom") { top = r.bottom + gap; left = a === "left" ? r.left : a === "right" ? r.right - tW : r.left + r.width / 2 - tW / 2; }
      else if (step.position === "top")    { top = r.top - tH - gap; left = a === "left" ? r.left : a === "right" ? r.right - tW : r.left + r.width / 2 - tW / 2; }
      else if (step.position === "left")   { left = r.left - tW - gap; top = r.top + r.height / 2 - tH / 2; }
      else                                 { left = r.right + gap; top = r.top + r.height / 2 - tH / 2; }
      left = Math.max(10, Math.min(left, window.innerWidth - tW - 10));
      top  = Math.max(10, Math.min(top,  window.innerHeight - tH - 10));
      setCoords({ top, left });
    };
    update(); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update);
  }, [step, targetRef]);
  return (
    <div ref={tipRef} style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 1000, width: 300 }}
      className="bg-black/90 backdrop-blur-xl border border-[--brand-border] rounded-2xl p-5 shadow-2xl shadow-black/60">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-[--text-primary] font-bold text-sm leading-snug pr-2">{step.title}</h3>
        <button onClick={onClose} className="text-[--text-secondary] hover:text-white text-xl leading-none transition flex-shrink-0">×</button>
      </div>
      <p className="text-[--text-secondary] text-xs leading-relaxed mb-4">{step.body}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="h-1.5 rounded-full transition-all duration-300"
              style={{ background: i === stepIndex ? "var(--brand-light)" : "var(--brand-dim)", width: i === stepIndex ? 12 : 6 }} />
          ))}
        </div>
        <div className="flex gap-2">
          {stepIndex > 0 && <button onClick={onPrev} className={`text-xs ${btnGhost} px-3 py-1.5 rounded-lg`}>Back</button>}
          {stepIndex < total - 1
            ? <button onClick={onNext} className={`text-xs ${btnPrimary} px-3 py-1.5 rounded-lg font-medium text-white`}>Next →</button>
            : <button onClick={onClose} className={`text-xs ${btnPrimary} px-3 py-1.5 rounded-lg font-medium text-white`}>Finish 🎉</button>}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PENCIL ICON
───────────────────────────────────────────── */
function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
      <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm-.646 6.061L9.293 2.5 3.5 8.293V9.5h1.207l5.5-5.5-.5-.5zM1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   BOOT EMPTY MODAL
───────────────────────────────────────────── */
function BootEmptyModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
      <div className={`${glass} p-7 rounded-2xl w-[340px] text-center space-y-4`}>
        <div className="text-4xl">⚡</div>
        <h3 className="text-[--text-primary] font-bold text-base">Nothing to launch yet</h3>
        <p className="text-[--text-secondary] text-sm leading-relaxed">
          Add at least one tool to your{" "}
          <span className="text-[--text-primary] font-semibold">Start of Day</span> or{" "}
          <span className="text-[--text-primary] font-semibold">Main Day</span>{" "}
          column first — then Boot Up My Day will open them all in one click.
        </p>
        <button onClick={onClose}
          className={`w-full ${btnPrimary} py-2.5 rounded-xl font-semibold text-[--text-primary]`}
          style={{ boxShadow: "0 0 14px var(--brand-glow)" }}>
          Got it
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION
───────────────────────────────────────────── */
function Section({ sectionId, title, onTitleChange, tourRef, highlighted }) {
  const storageKey = `tools-${sectionId}`;
  const [tools,        setTools]        = useState(() => JSON.parse(localStorage.getItem(storageKey)) || []);
  const [showModal,    setShowModal]    = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [name,  setName]  = useState("");
  const [url,   setUrl]   = useState("");
  const [desc,  setDesc]  = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOver,  setDragOver]  = useState(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft,   setTitleDraft]   = useState(title);
  const titleInputRef = useRef(null);

  useEffect(() => setTitleDraft(title), [title]);
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(tools)); }, [tools]);
  useEffect(() => { if (editingTitle && titleInputRef.current) titleInputRef.current.select(); }, [editingTitle]);

  const commitTitle = () => {
    if (titleDraft.trim()) onTitleChange(titleDraft.trim()); else setTitleDraft(title);
    setEditingTitle(false);
  };
  const openAdd  = () => { setName(""); setUrl(""); setDesc(""); setEditingIndex(null); setShowModal(true); };
  const openEdit = (i, e) => {
    e.stopPropagation();
    const t = tools[i]; setName(t.name); setUrl(t.url); setDesc(t.desc || "");
    setEditingIndex(i); setShowModal(true);
  };
  const saveTool = () => {
    if (!name || !url) return;
    const t = { name, url, desc };
    if (editingIndex !== null) { const u = [...tools]; u[editingIndex] = t; setTools(u); }
    else setTools([...tools, t]);
    setShowModal(false);
  };
  const deleteTool      = (i, e) => { e.stopPropagation(); setTools(tools.filter((_, idx) => idx !== i)); };
  const handleDragStart = (e, i) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver  = (e, i) => { e.preventDefault(); setDragOver(i); };
  const handleDrop      = (i) => {
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOver(null); return; }
    const u = [...tools]; const d = u.splice(dragIndex, 1)[0]; u.splice(i, 0, d);
    setTools(u); setDragIndex(null); setDragOver(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOver(null); };

  return (
    <div ref={tourRef}
      className={`${glass} rounded-2xl p-5 w-full h-full flex flex-col relative transition-all duration-300 ${highlighted ? tourRingCls : ""}`}
      style={highlighted ? { zIndex: 60 } : {}}>

      {/* Editable title */}
      <div className="flex items-center gap-1.5 mb-4 group flex-shrink-0 min-w-0">
        {editingTitle ? (
          <input ref={titleInputRef} value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)} onBlur={commitTitle}
            onKeyDown={(e) => { if (e.key === "Enter") commitTitle(); if (e.key === "Escape") { setTitleDraft(title); setEditingTitle(false); } }}
            className="flex-1 bg-transparent border-b border-[--brand] text-[--text-primary] text-sm font-semibold tracking-widest uppercase focus:outline-none py-0.5 min-w-0" />
        ) : (
          <>
            <h2 className="text-sm font-semibold text-[--text-muted] tracking-widest uppercase truncate">{title}</h2>
            <button onClick={() => setEditingTitle(true)} title="Rename section"
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-[--text-muted] hover:text-[--text-primary] transition-opacity flex-shrink-0">
              <PencilIcon />
            </button>
          </>
        )}
      </div>

      {/* CTA or tool list */}
      {tools.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: "var(--brand-bg)", border: "1px dashed var(--brand-border)" }}>🔗</div>
          <p className="text-[--text-muted] text-xs leading-relaxed">No tools yet — add links<br />you open every day.</p>
          <button onClick={openAdd} className={`${btnPrimary} px-4 py-2 rounded-xl text-xs font-semibold text-[--text-primary]`}
            style={{ boxShadow: "0 0 12px var(--brand-glow)" }}>
            + Add Your First Tool
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
          {tools.map((tool, index) => (
            <div key={index}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`bg-white/5 hover:bg-[--brand-bg] border rounded-xl flex items-start gap-0 transition ${
                dragOver === index && dragIndex !== index ? "border-[--brand-light] bg-[--brand-hover-bg]" : "border-[--card-border]"
              }`}>
              <div draggable onDragStart={(e) => handleDragStart(e, index)}
                className="flex items-center justify-center px-2 py-3 cursor-grab active:cursor-grabbing text-[--text-muted] hover:text-[--text-secondary] transition flex-shrink-0 self-stretch rounded-l-xl select-none"
                style={{ touchAction: "none" }}>
                <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                  <circle cx="2.5" cy="2.5"  r="1.5"/><circle cx="7.5" cy="2.5"  r="1.5"/>
                  <circle cx="2.5" cy="8"    r="1.5"/><circle cx="7.5" cy="8"    r="1.5"/>
                  <circle cx="2.5" cy="13.5" r="1.5"/><circle cx="7.5" cy="13.5" r="1.5"/>
                </svg>
              </div>
              <div className="flex flex-1 items-start gap-2 py-2.5 pr-2 min-w-0">
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  <FaviconIcon url={tool.url} />
                </div>
                <div className="min-w-0 flex-1">
                  <a href={tool.url} target="_blank" rel="noopener noreferrer"
                    className="text-[--text-primary] hover:text-white font-medium text-sm transition truncate block">
                    {tool.name}
                  </a>
                  {tool.desc && <div className="text-xs text-[--text-muted] mt-0.5 truncate">{tool.desc}</div>}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button onClick={(e) => openEdit(index, e)} className={`text-xs ${btnPrimary} px-2 py-0.5 rounded text-[--text-primary]`}>Edit</button>
                  <button onClick={(e) => deleteTool(index, e)} className="text-xs bg-red-900/50 hover:bg-red-800/60 border border-red-700/40 px-2 py-0.5 rounded transition">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tools.length > 0 && (
        <button onClick={openAdd}
          className={`mt-auto pt-3 w-full ${btnPrimary} py-2 rounded-xl text-xs font-semibold tracking-wide flex-shrink-0 text-[--text-primary]`}>
          + Add Tool
        </button>
      )}

      {showModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
          <div className={`${glass} p-5 rounded-2xl w-full max-w-[260px] space-y-3`}>
            <h3 className="text-[--text-primary] font-semibold text-sm">{editingIndex !== null ? "Edit Tool" : "Add Tool"}</h3>
            {[{ value: name, setter: setName, placeholder: "Name" }, { value: url, setter: setUrl, placeholder: "URL" }].map(({ value, setter, placeholder }) => (
              <input key={placeholder} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                className="w-full p-2 bg-white/5 border border-[--card-border] rounded-lg text-sm text-white placeholder-[--text-muted] focus:outline-none focus:border-[--brand]" />
            ))}
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" rows={2}
              className="w-full p-2 bg-white/5 border border-[--card-border] rounded-lg text-sm text-white placeholder-[--text-muted] focus:outline-none focus:border-[--brand] resize-none" />
            <div className="flex gap-2">
              <button onClick={saveTool}                  className={`flex-1 ${btnPrimary} py-2 rounded-lg text-sm font-medium text-white`}>Save</button>
              <button onClick={() => setShowModal(false)} className={`flex-1 ${btnGhost}  py-2 rounded-lg text-sm text-[--text-primary]`}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARE MODAL
───────────────────────────────────────────── */
function ShareModal({ getExportData, onClose }) {
  const [mode,       setMode]       = useState("export");
  const [importText, setImportText] = useState("");
  const [copied,     setCopied]     = useState("");
  const [key,        setKey]        = useState("");
  const [shareUrl,   setShareUrl]   = useState("");
  const [generating, setGenerating] = useState(true);
  const snapshot = readSnapshot();
  const snapshotAge = snapshot ? Math.round((Date.now() - snapshot.at) / 60000) : null;

  useEffect(() => {
    (async () => {
      const k = await encodeData(getExportData());
      setKey(k);
      setShareUrl(buildShareUrl(k));
      setGenerating(false);
    })();
  }, []);

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label); setTimeout(() => setCopied(""), 2000);
  };

  const handleImport = async () => {
    const parsed = await decodeData(importText);
    if (!parsed) { alert("Invalid code or URL — please check and try again."); return; }
    if (parsed.sod      !== undefined) localStorage.setItem("tools-sod",      JSON.stringify(parsed.sod));
    if (parsed.md       !== undefined) localStorage.setItem("tools-md",       JSON.stringify(parsed.md));
    if (parsed.eod      !== undefined) localStorage.setItem("tools-eod",      JSON.stringify(parsed.eod));
    if (parsed.notes    !== undefined) localStorage.setItem("notes",          parsed.notes ?? "");
    if (parsed.schedule !== undefined) localStorage.setItem("schedule",       JSON.stringify(parsed.schedule ?? {}));
    if (parsed.titles   !== undefined) localStorage.setItem("section-titles", JSON.stringify(parsed.titles));
    if (parsed.themeId  !== undefined) localStorage.setItem("themeId",        parsed.themeId);
    location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
      <div className={`${glass} p-6 rounded-2xl w-[380px]`}>
        <div className="flex rounded-xl overflow-hidden border border-[--card-border] mb-5">
          {["export", "import"].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2 text-sm font-medium transition ${mode === m ? "bg-[--btn-primary-bg] text-white" : "text-[--text-secondary] hover:text-[--text-primary]"}`}>
              {m === "export" ? "📤 Export / Share" : "📥 Import"}
            </button>
          ))}
        </div>

        {mode === "export" ? (
          <div className="space-y-3">
            <p className="text-[--text-muted] text-xs">
              Compressed backup code — paste it on any machine to restore your full setup. Great for onboarding new starters.
            </p>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[--text-muted] text-xs uppercase tracking-widest">Backup Code</label>
                {!generating && (
                  <span className="text-[10px] text-[--text-muted] opacity-60 tabular-nums">{key.length} chars</span>
                )}
              </div>
              {generating ? (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-white/5 border border-[--card-border] rounded-lg">
                  <div className="w-3 h-3 border-2 border-white/20 border-t-[--brand-light] rounded-full animate-spin flex-shrink-0" />
                  <span className="text-xs text-[--text-muted]">Compressing…</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input readOnly value={key} onClick={(e) => e.target.select()}
                    className="flex-1 bg-white/5 border border-[--card-border] rounded-lg px-2.5 py-2 text-xs text-[--text-secondary] focus:outline-none font-mono truncate" />
                  <button onClick={() => copy(key, "code")}
                    className={`${btnPrimary} px-3 py-2 rounded-lg text-xs font-medium text-white flex-shrink-0`}>
                    {copied === "code" ? "✓" : "Copy"}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => !generating && copy(shareUrl, "url")}
              className={`w-full ${btnGhost} py-2.5 rounded-xl text-sm text-[--text-primary] flex items-center justify-center gap-2 ${generating ? "opacity-40 cursor-wait" : ""}`}>
              <span>🔗</span>
              <span>{copied === "url" ? "✓ URL Copied!" : "Copy Share URL"}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[--text-muted] text-xs">Paste a backup code or full share URL to restore your setup.</p>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste code or share URL here…" rows={4}
              className="w-full bg-white/5 border border-[--card-border] rounded-lg px-3 py-2 text-xs text-[--text-secondary] placeholder-[--text-muted] focus:outline-none focus:border-[--brand] resize-none font-mono" />
            <button onClick={handleImport}
              className={`w-full ${btnPrimary} py-2.5 rounded-xl font-medium text-white`}>
              Import & Reload
            </button>
            {snapshot && (
              <div className={`${glass} rounded-xl p-3 space-y-2`}>
                <div className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <div>
                    <p className="text-[--text-primary] text-xs font-semibold">Auto-backup available</p>
                    <p className="text-[--text-muted] text-[10px]">
                      Saved {snapshotAge === 0 ? "just now" : `${snapshotAge} min${snapshotAge !== 1 ? "s" : ""} ago`}
                    </p>
                  </div>
                </div>
                <button onClick={() => restoreSnapshot(snapshot)}
                  className={`w-full ${btnGhost} py-2 rounded-lg text-xs text-[--text-primary] font-medium`}>
                  Restore Auto-Backup
                </button>
              </div>
            )}
          </div>
        )}

        <button onClick={onClose}
          className={`mt-3 w-full ${btnGhost} py-2 rounded-xl text-[--text-primary] text-sm`}>
          Close
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHIFT SCHEDULER
───────────────────────────────────────────── */
function ShiftScheduler({ tourRef, highlighted }) {
  const [schedule,    setSchedule]    = useState(() => JSON.parse(localStorage.getItem("schedule")) || {});
  const [selectedKey, setSelectedKey] = useState(null);
  const [newItem,     setNewItem]     = useState("");
  const [time,        setTime]        = useState(new Date());
  const [calDragIndex, setCalDragIndex] = useState(null);
  const [calDragOver,  setCalDragOver]  = useState(null);
  const week     = getRollingWeek();
  const todayKey = getDateKey(new Date());

  useEffect(() => { localStorage.setItem("schedule", JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const addItem = () => {
    if (!newItem.trim() || !selectedKey) return;
    setSchedule({ ...schedule, [selectedKey]: [...(schedule[selectedKey] || []), newItem.trim()] });
    setNewItem("");
  };
  const deleteItem = (i) =>
    setSchedule({ ...schedule, [selectedKey]: schedule[selectedKey].filter((_, idx) => idx !== i) });

  const handleCalDragStart = (e, i) => {
    setCalDragIndex(i);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleCalDragOver = (e, i) => {
    e.preventDefault();
    setCalDragOver(i);
  };
  const handleCalDrop = (i) => {
    if (calDragIndex === null || calDragIndex === i) { setCalDragIndex(null); setCalDragOver(null); return; }
    const items = [...(schedule[selectedKey] || [])];
    const [moved] = items.splice(calDragIndex, 1);
    items.splice(i, 0, moved);
    setSchedule({ ...schedule, [selectedKey]: items });
    setCalDragIndex(null);
    setCalDragOver(null);
  };
  const handleCalDragEnd = () => { setCalDragIndex(null); setCalDragOver(null); };

  const selectedItems = selectedKey ? (schedule[selectedKey] || []) : [];

  return (
    <div ref={tourRef}
      style={highlighted ? { zIndex: 60, position: "relative" } : {}}
      className={`${glass} p-4 rounded-2xl flex-shrink-0 transition-all duration-300 ${highlighted ? tourRingCls : ""}`}>

      <div className="text-center font-mono text-base mb-1"
        style={{ color: "var(--text-primary)", filter: "drop-shadow(0 0 8px var(--brand-glow))" }}>
        {time.toLocaleTimeString()}
      </div>
      <div className="text-center text-[--text-muted] text-xs mb-2 tracking-wide">
        {new Date().toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {week.map((date) => {
          const key        = getDateKey(date);
          const isToday    = key === todayKey;
          const isSelected = key === selectedKey;
          const hasItems   = (schedule[key] || []).length > 0;
          return (
            <div key={key}
              onClick={() => setSelectedKey(isSelected ? null : key)}
              className="flex flex-col items-center py-1.5 rounded-lg cursor-pointer transition-all select-none"
              style={
                isSelected  ? { background: "var(--brand)", boxShadow: "0 0 8px var(--brand-glow)" }
                : isToday   ? { background: "var(--brand-dim)", border: "1px solid var(--brand-border)" }
                : { background: "rgba(255,255,255,0.05)" }
              }>
              <span className="text-[10px] font-semibold leading-none"
                style={{ color: isSelected ? "#fff" : "var(--text-muted)" }}>
                {DAY_ABBR[date.getDay()]}
              </span>
              <span className="text-sm font-bold leading-tight mt-0.5"
                style={{ color: isSelected ? "#fff" : isToday ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {date.getDate()}
              </span>
              <div className="mt-0.5 h-1 w-1 rounded-full"
                style={{ background: hasItems ? (isSelected ? "rgba(255,255,255,0.9)" : "var(--brand-light)") : "transparent" }} />
            </div>
          );
        })}
      </div>

      {selectedKey && (
        <div className="space-y-1.5 mt-2">
          <div className="text-[--text-muted] text-xs font-semibold uppercase tracking-widest mb-1">
            {DAY_NAMES[dateFromKey(selectedKey).getDay()]} — {formatDate(dateFromKey(selectedKey))}
          </div>
          {selectedItems.length === 0 && (
            <p className="text-[--text-muted] text-xs italic py-1 px-0.5">No items yet — add one below.</p>
          )}
          {selectedItems.map((item, i) => (
            <div key={i}
              draggable
              onDragStart={(e) => handleCalDragStart(e, i)}
              onDragOver={(e) => handleCalDragOver(e, i)}
              onDrop={() => handleCalDrop(i)}
              onDragEnd={handleCalDragEnd}
              className={`flex items-center gap-2 border rounded-lg text-xs transition cursor-default ${
                calDragOver === i && calDragIndex !== i
                  ? "border-[--brand-light] bg-[--brand-hover-bg]"
                  : "bg-white/5 border-[--card-border]"
              }`}>
              <div className="px-2 py-2.5 cursor-grab active:cursor-grabbing text-[--text-muted] hover:text-[--text-secondary] transition flex-shrink-0 select-none">
                <svg width="8" height="13" viewBox="0 0 10 16" fill="currentColor">
                  <circle cx="2.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="2.5" r="1.5"/>
                  <circle cx="2.5" cy="8"   r="1.5"/><circle cx="7.5" cy="8"   r="1.5"/>
                  <circle cx="2.5" cy="13.5" r="1.5"/><circle cx="7.5" cy="13.5" r="1.5"/>
                </svg>
              </div>
              <span className="text-[--text-primary] truncate flex-1 py-2">{item}</span>
              <button onClick={() => deleteItem(i)} className="text-red-400 hover:text-red-300 transition flex-shrink-0 text-xs px-2 py-2">✕</button>
            </div>
          ))}
          <div className="flex gap-1 pt-0.5">
            <input value={newItem} onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Add task or follow-up…"
              className="flex-1 p-1.5 bg-white/5 border border-[--card-border] rounded-lg text-xs text-white placeholder-[--text-muted] focus:outline-none focus:border-[--brand]" />
            <button onClick={addItem} className={`${btnPrimary} px-3 rounded-lg text-xs font-bold text-white`}>+</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   APP
───────────────────────────────────────────── */
export default function App() {
  const [notes,          setNotes]          = useState(() => localStorage.getItem("notes") || "");
  const [showShare,      setShowShare]      = useState(false);
  const [showBootEmpty,  setShowBootEmpty]  = useState(false);
  const [tourActive,     setTourActive]     = useState(false);
  const [tourStep,       setTourStep]       = useState(0);

  const [sectionTitles, setSectionTitles] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("section-titles"));
      return saved && saved.length === 3 ? saved : SECTION_DEFS.map((s) => s.defaultTitle);
    } catch { return SECTION_DEFS.map((s) => s.defaultTitle); }
  });
  const updateTitle = (index, newTitle) => {
    const updated = sectionTitles.map((t, i) => (i === index ? newTitle : t));
    setSectionTitles(updated);
    localStorage.setItem("section-titles", JSON.stringify(updated));
  };

  const [themeId, setThemeId] = useState(() => localStorage.getItem("themeId") || "concentrix");
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  useEffect(() => { applyTheme(theme); }, [theme]);

  const bgImage  = theme.bg === "orange" ? bgOrange : theme.bg === "cyan" ? bgCctx : bg;
  const bgFilter = (theme.bg === "orange" || theme.bg === "cyan")
    ? "none"
    : `hue-rotate(${theme.hueRotate}deg) saturate(${theme.grayscale ? 0 : 1.1}) ${theme.grayscale ? "grayscale(1)" : ""}`.trim();

  useEffect(() => {
    if (window.location.hash.startsWith("#key=")) {
      setShowShare(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("hasVisited")) {
      localStorage.setItem("hasVisited", "1");
      const t = setTimeout(() => { setTourStep(0); setTourActive(true); }, 900);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => { localStorage.setItem("notes", notes); }, [notes]);

  // Auto-snapshot: save on mount, every 60s, and before unload
  useEffect(() => {
    saveSnapshot();
    const interval = setInterval(saveSnapshot, 60_000);
    window.addEventListener("beforeunload", saveSnapshot);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", saveSnapshot);
    };
  }, []);

  const refs = {
    header:         useRef(null),
    "start-of-day": useRef(null),
    "main-day":     useRef(null),
    "end-of-day":   useRef(null),
    "boot-btn":     useRef(null),
    notes:          useRef(null),
    scheduler:      useRef(null),
    "share-btn":    useRef(null),
    "tour-btn":     useRef(null),
  };

  useEffect(() => {
    if (!tourActive) return;
    refs[TOUR_STEPS[tourStep]?.id]?.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [tourActive, tourStep]);

  const startTour = () => { setTourStep(0); setTourActive(true); };
  const endTour   = () => setTourActive(false);
  const nextStep  = () => setTourStep((s) => Math.min(s + 1, TOUR_STEPS.length - 1));
  const prevStep  = () => setTourStep((s) => Math.max(s - 1, 0));
  const currentStep    = TOUR_STEPS[tourStep];
  const currentStepRef = refs[currentStep?.id];
  const isTour = (id) => tourActive && currentStep?.id === id;

  const getExportData = () => ({
    sod:      JSON.parse(localStorage.getItem("tools-sod")  || "[]"),
    md:       JSON.parse(localStorage.getItem("tools-md")   || "[]"),
    eod:      JSON.parse(localStorage.getItem("tools-eod")  || "[]"),
    titles:   sectionTitles,
    notes,
    schedule: JSON.parse(localStorage.getItem("schedule")   || "{}"),
    themeId,
  });

  const bootUpMyDay = () => {
    const sod  = JSON.parse(localStorage.getItem("tools-sod") || "[]");
    const md   = JSON.parse(localStorage.getItem("tools-md")  || "[]");
    const urls = [...sod, ...md].map((t) => t.url).filter(Boolean);
    if (!urls.length) { setShowBootEmpty(true); return; }
    urls.forEach((u) => window.open(u, "_blank"));
  };

  return (
    <>
      {/* Background */}
      <div style={{
        position: "fixed", inset: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover", backgroundPosition: "center",
        filter: bgFilter, zIndex: 0,
        transition: "filter 0.4s ease",
      }} />
      <div style={{ position: "fixed", inset: 0, background: "var(--overlay)", zIndex: 1, transition: "background 0.35s ease" }} />
      {tourActive && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 50, pointerEvents: "none" }} />
      )}

      {/* Main grid */}
      <div className="text-white" style={{
        position: "relative", zIndex: 2, height: "100vh",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gridTemplateColumns: "1fr 272px",
        gap: "0 20px",
        padding: "28px 24px 90px 24px",
        boxSizing: "border-box",
        overflow: "hidden",
      }}>

        {/* HEADER */}
        <div ref={refs.header}
          style={{ gridColumn: "1 / -1", marginBottom: 20, zIndex: isTour("header") ? 60 : "auto" }}
          className={`flex justify-between items-center transition-all duration-300 rounded-2xl ${isTour("header") ? `${tourRingCls} bg-white/5 px-3 py-2` : ""}`}>
          <div className="flex items-center gap-3 group">
            <img src={logo} alt="AgentHub" className="w-9 h-9 object-contain group-hover:scale-110 transition"
              style={{ filter: "drop-shadow(0 0 10px var(--brand-glow))" }} />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(to right, var(--brand-light), var(--brand))" }}>
                AgentHub
              </span>
            </h1>
          </div>
          <div className="flex gap-2 items-center">
            <div ref={refs["share-btn"]}
              style={isTour("share-btn") ? { zIndex: 60, position: "relative" } : {}}
              className={`transition-all duration-300 ${isTour("share-btn") ? `${tourRingCls} rounded-xl p-1` : ""}`}>
              <button onClick={() => setShowShare(true)}
                className={`${btnGhost} px-3 py-1 rounded-lg text-sm text-[--text-primary] flex items-center gap-1.5`}>
                <span>🔗</span><span>Share</span>
              </button>
            </div>
            <ThemePicker themeId={themeId} setThemeId={setThemeId} />
            <button ref={refs["tour-btn"]} onClick={startTour}
              style={isTour("tour-btn") ? { zIndex: 60, position: "relative" } : {}}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${btnPrimary} text-sm font-bold hover:scale-110 text-[--text-primary] ${isTour("tour-btn") ? tourRingCls : ""}`}>
              ?
            </button>
          </div>
        </div>

        {/* LEFT: three tool columns */}
        <div style={{ gridRow: 2, gridColumn: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, minHeight: 0 }}>
          {SECTION_DEFS.map(({ id }, index) => {
            const tourId = ["start-of-day", "main-day", "end-of-day"][index];
            return (
              <Section key={id} sectionId={id}
                title={sectionTitles[index]}
                onTitleChange={(t) => updateTitle(index, t)}
                tourRef={refs[tourId]}
                highlighted={isTour(tourId)} />
            );
          })}
        </div>

        {/* RIGHT: scripts/notes + shift scheduler */}
        <div style={{ gridRow: 2, gridColumn: 2, display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>
          <div ref={refs.notes}
            style={isTour("notes") ? { zIndex: 60, position: "relative", flex: "1 1 0" } : { flex: "1 1 0" }}
            className={`${glass} p-4 rounded-2xl flex flex-col min-h-0 transition-all duration-300 ${isTour("notes") ? tourRingCls : ""}`}>
            <div className="flex items-baseline justify-between mb-2 flex-shrink-0">
              <h2 className="text-[--text-muted] font-semibold text-sm uppercase tracking-widest">Scripts & Notes</h2>
              <span className="text-[10px] text-[--text-muted] opacity-50">auto-saved</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Note down…"
              className="bg-white/5 border border-[--card-border] p-2 rounded-xl flex-1 text-sm text-white placeholder-[--text-muted] focus:outline-none focus:border-[--brand] resize-none min-h-0 leading-relaxed"
            />
          </div>
          <ShiftScheduler tourRef={refs.scheduler} highlighted={isTour("scheduler")} />
        </div>
      </div>

      {/* ⚡ BOOT UP MY DAY */}
      <button ref={refs["boot-btn"]} onClick={bootUpMyDay}
        className={`fixed bottom-6 left-6 flex items-center gap-2 ${btnPrimary} text-white font-semibold px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 ${isTour("boot-btn") ? tourRingCls : ""}`}
        style={{ zIndex: isTour("boot-btn") ? 60 : 20, boxShadow: "0 4px 24px var(--brand-glow)" }}>
        ⚡ Boot Up My Day
      </button>

      {showShare     && <ShareModal getExportData={getExportData} onClose={() => setShowShare(false)} />}
      {showBootEmpty && <BootEmptyModal onClose={() => setShowBootEmpty(false)} />}

      {/* Copyright */}
      <p className="fixed bottom-2 right-4 text-[10px] text-white/20 select-none" style={{ zIndex: 10 }}>
        © 2026 Kyron (Dev_Kyron) · All Rights Reserved
      </p>

      {tourActive && (
        <TourTooltip step={currentStep} stepIndex={tourStep} total={TOUR_STEPS.length}
          onNext={nextStep} onPrev={prevStep} onClose={endTour} targetRef={currentStepRef} />
      )}
    </>
  );
}

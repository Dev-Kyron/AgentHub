import { useState, useEffect, useRef } from "react";
import logo from "./assets/logo.png";
import bg from "./assets/bg.png";
import bgOrange from "./assets/bg_orange.png";

/* ─────────────────────────────────────────────
   STORAGE MIGRATION
   Old keys used human-readable titles; new keys
   use stable IDs so renaming never loses data.
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
   CALENDAR HELPERS
   Rolling 7-day strip anchored to today.
   Schedule keyed by ISO date "YYYY-MM-DD" so
   items are tied to a real calendar date, not
   a repeating weekday name.
───────────────────────────────────────────── */
function getDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getRollingWeek() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
}

const DAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/* ─────────────────────────────────────────────
   THEMES
   hueRotate: CSS hue-rotate degrees on bg.png.
   grayscale: 0–1  (B&W = 1).
   bg: "orange" → swap to bg_orange.png, no filter.
   Orange is listed first and is the default.
───────────────────────────────────────────── */
const THEMES = [
  {
    id: "orange", name: "Orange", hex: "#e85d04",
    hueRotate: 0, grayscale: 0, bg: "orange",
    vars: {
      "--brand":            "#e85d04",
      "--brand-light":      "#fb8c00",
      "--brand-dim":        "#7c2d00",
      "--brand-glow":       "rgba(232,93,4,0.60)",
      "--brand-ring":       "rgba(251,140,0,0.85)",
      "--brand-border":     "rgba(232,93,4,0.45)",
      "--brand-bg":         "rgba(232,93,4,0.10)",
      "--brand-hover-bg":   "rgba(232,93,4,0.22)",
      "--text-primary":     "#fed7aa",
      "--text-secondary":   "rgba(253,186,116,0.75)",
      "--text-muted":       "rgba(253,186,116,0.45)",
      "--card-border":      "rgba(194,65,12,0.40)",
      "--card-bg":          "rgba(0,0,0,0.42)",
      "--overlay":          "rgba(10,3,0,0.42)",
      "--btn-primary-bg":   "rgba(194,65,12,0.72)",
      "--btn-primary-hover":"rgba(234,88,12,0.88)",
    },
  },
  {
    id: "purple", name: "Purple", hex: "#7c3aed",
    hueRotate: 0, grayscale: 0, bg: null,
    vars: {
      "--brand":            "#7c3aed",
      "--brand-light":      "#a78bfa",
      "--brand-dim":        "#4c1d95",
      "--brand-glow":       "rgba(124,58,237,0.55)",
      "--brand-ring":       "rgba(168,85,247,0.8)",
      "--brand-border":     "rgba(124,58,237,0.4)",
      "--brand-bg":         "rgba(124,58,237,0.08)",
      "--brand-hover-bg":   "rgba(124,58,237,0.18)",
      "--text-primary":     "#e9d5ff",
      "--text-secondary":   "rgba(216,180,254,0.7)",
      "--text-muted":       "rgba(196,167,255,0.45)",
      "--card-border":      "rgba(109,40,217,0.35)",
      "--card-bg":          "rgba(0,0,0,0.40)",
      "--overlay":          "rgba(0,0,0,0.38)",
      "--btn-primary-bg":   "rgba(109,40,217,0.70)",
      "--btn-primary-hover":"rgba(124,58,237,0.85)",
    },
  },
  {
    id: "blue", name: "Blue", hex: "#1a56c4",
    hueRotate: 175, grayscale: 0, bg: null,
    vars: {
      "--brand":            "#1a56c4",
      "--brand-light":      "#60a5fa",
      "--brand-dim":        "#1e3a8a",
      "--brand-glow":       "rgba(26,86,196,0.55)",
      "--brand-ring":       "rgba(59,130,246,0.8)",
      "--brand-border":     "rgba(26,86,196,0.4)",
      "--brand-bg":         "rgba(26,86,196,0.08)",
      "--brand-hover-bg":   "rgba(26,86,196,0.18)",
      "--text-primary":     "#bfdbfe",
      "--text-secondary":   "rgba(147,197,253,0.7)",
      "--text-muted":       "rgba(147,197,253,0.45)",
      "--card-border":      "rgba(30,64,175,0.35)",
      "--card-bg":          "rgba(0,0,0,0.40)",
      "--overlay":          "rgba(0,0,10,0.40)",
      "--btn-primary-bg":   "rgba(30,64,175,0.70)",
      "--btn-primary-hover":"rgba(26,86,196,0.85)",
    },
  },
  {
    id: "red", name: "Red", hex: "#dc2626",
    hueRotate: 130, grayscale: 0, bg: null,
    vars: {
      "--brand":            "#dc2626",
      "--brand-light":      "#f87171",
      "--brand-dim":        "#7f1d1d",
      "--brand-glow":       "rgba(220,38,38,0.55)",
      "--brand-ring":       "rgba(248,113,113,0.8)",
      "--brand-border":     "rgba(220,38,38,0.4)",
      "--brand-bg":         "rgba(220,38,38,0.08)",
      "--brand-hover-bg":   "rgba(220,38,38,0.18)",
      "--text-primary":     "#fecaca",
      "--text-secondary":   "rgba(252,165,165,0.7)",
      "--text-muted":       "rgba(252,165,165,0.45)",
      "--card-border":      "rgba(185,28,28,0.35)",
      "--card-bg":          "rgba(0,0,0,0.40)",
      "--overlay":          "rgba(10,0,0,0.40)",
      "--btn-primary-bg":   "rgba(185,28,28,0.70)",
      "--btn-primary-hover":"rgba(220,38,38,0.85)",
    },
  },
  {
    id: "pink", name: "Pink", hex: "#db2777",
    hueRotate: 315, grayscale: 0, bg: null,
    vars: {
      "--brand":            "#db2777",
      "--brand-light":      "#f472b6",
      "--brand-dim":        "#831843",
      "--brand-glow":       "rgba(219,39,119,0.55)",
      "--brand-ring":       "rgba(244,114,182,0.8)",
      "--brand-border":     "rgba(219,39,119,0.4)",
      "--brand-bg":         "rgba(219,39,119,0.08)",
      "--brand-hover-bg":   "rgba(219,39,119,0.18)",
      "--text-primary":     "#fbcfe8",
      "--text-secondary":   "rgba(249,168,212,0.7)",
      "--text-muted":       "rgba(249,168,212,0.45)",
      "--card-border":      "rgba(190,24,93,0.35)",
      "--card-bg":          "rgba(0,0,0,0.40)",
      "--overlay":          "rgba(8,0,4,0.40)",
      "--btn-primary-bg":   "rgba(190,24,93,0.70)",
      "--btn-primary-hover":"rgba(219,39,119,0.85)",
    },
  },
  {
    id: "bw", name: "B & W", hex: "#6b7280",
    hueRotate: 0, grayscale: 1, bg: null,
    vars: {
      "--brand":            "#9ca3af",
      "--brand-light":      "#e5e7eb",
      "--brand-dim":        "#374151",
      "--brand-glow":       "rgba(156,163,175,0.40)",
      "--brand-ring":       "rgba(209,213,219,0.7)",
      "--brand-border":     "rgba(107,114,128,0.35)",
      "--brand-bg":         "rgba(255,255,255,0.05)",
      "--brand-hover-bg":   "rgba(255,255,255,0.12)",
      "--text-primary":     "#f3f4f6",
      "--text-secondary":   "rgba(209,213,219,0.70)",
      "--text-muted":       "rgba(156,163,175,0.50)",
      "--card-border":      "rgba(75,85,99,0.40)",
      "--card-bg":          "rgba(0,0,0,0.45)",
      "--overlay":          "rgba(0,0,0,0.42)",
      "--btn-primary-bg":   "rgba(55,65,81,0.72)",
      "--btn-primary-hover":"rgba(75,85,99,0.88)",
    },
  },
];

function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

/* ─────────────────────────────────────────────
   DATA ENCODE / DECODE  (short key for sharing)
───────────────────────────────────────────── */
function encodeData(data) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(data)))); }
  catch { return ""; }
}

function decodeData(input) {
  try {
    const key = input.includes("#key=") ? input.split("#key=").pop() : input.trim();
    return JSON.parse(decodeURIComponent(escape(atob(key))));
  } catch { return null; }
}

function buildShareUrl(data) {
  return `${window.location.origin}${window.location.pathname}#key=${encodeData(data)}`;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getFavicon(url) {
  try { return `${new URL(url).origin}/favicon.ico`; } catch { return null; }
}

/* ─────────────────────────────────────────────
   SHARED STYLE TOKENS
───────────────────────────────────────────── */
const glass       = "bg-[--card-bg] backdrop-blur-md border border-[--card-border] shadow-lg shadow-black/40";
const btnPrimary  = "bg-[--btn-primary-bg] hover:bg-[--btn-primary-hover] border border-[--brand-border] transition";
const btnGhost    = "bg-white/10 hover:bg-white/20 backdrop-blur border border-[--card-border] transition";
const tourRingCls = "ring-2 ring-[--brand-ring] ring-offset-1 ring-offset-black/10 shadow-[0_0_18px_var(--brand-glow)]";

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
        <div className={`${glass} absolute top-full right-0 mt-2 p-3 rounded-2xl`} style={{ width: 212, zIndex: 100 }}>
          <div className="text-[--text-muted] text-xs font-semibold uppercase tracking-widest mb-2 px-1">Brand Colour</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {THEMES.map((t) => (
              <button key={t.id}
                onClick={() => { setThemeId(t.id); localStorage.setItem("themeId", t.id); setOpen(false); }}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition ${
                  themeId === t.id
                    ? "bg-[--brand-hover-bg] border border-[--brand-ring] text-[--text-primary]"
                    : "bg-[--brand-bg] hover:bg-[--brand-hover-bg] border border-transparent text-[--text-secondary]"
                }`}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: t.hex, display: "inline-block", flexShrink: 0 }} />
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
  { id: "notes",        title: "📋 Scripts & Notes",       body: "Paste call scripts, talking points or shift notes here. Saves automatically — always there when you need it.", position: "left", align: "center" },
  { id: "scheduler",    title: "📅 Shift Scheduler",       body: "Shows today + the next 6 days with real dates. Click any date to add reminders or follow-ups. A dot appears when a day has items.", position: "left", align: "center" },
  { id: "share-btn",    title: "🔗 Share / Backup",        body: "Copy a short code or URL to back up your setup — or hand your entire tool config to a new starter in seconds.", position: "bottom", align: "right" },
  { id: "tour-btn",     title: "🎉 That's everything!",    body: "Replay this tour any time with the ? button. Happy hustling!", position: "bottom", align: "right" },
];

function TourTooltip({ step, stepIndex, total, onNext, onPrev, onClose, targetRef }) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tipRef = useRef(null);

  useEffect(() => {
    if (!targetRef?.current) return;
    const update = () => {
      const r   = targetRef.current.getBoundingClientRect();
      const tH  = tipRef.current?.offsetHeight || 160;
      const tW  = tipRef.current?.offsetWidth  || 300;
      const gap = 14;
      const a   = step.align || "center";
      let top, left;
      if (step.position === "bottom") {
        top  = r.bottom + gap;
        left = a === "left" ? r.left : a === "right" ? r.right - tW : r.left + r.width / 2 - tW / 2;
      } else if (step.position === "top") {
        top  = r.top - tH - gap;
        left = a === "left" ? r.left : a === "right" ? r.right - tW : r.left + r.width / 2 - tW / 2;
      } else if (step.position === "left") {
        left = r.left - tW - gap; top = r.top + r.height / 2 - tH / 2;
      } else {
        left = r.right + gap; top = r.top + r.height / 2 - tH / 2;
      }
      left = Math.max(10, Math.min(left, window.innerWidth  - tW - 10));
      top  = Math.max(10, Math.min(top,  window.innerHeight - tH - 10));
      setCoords({ top, left });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
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
  const deleteTool    = (i, e) => { e.stopPropagation(); setTools(tools.filter((_, idx) => idx !== i)); };
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
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
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
          {tools.map((tool, index) => {
            const favicon = getFavicon(tool.url);
            return (
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
                    <circle cx="2.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="2.5" r="1.5"/>
                    <circle cx="2.5" cy="8"   r="1.5"/><circle cx="7.5" cy="8"   r="1.5"/>
                    <circle cx="2.5" cy="13.5" r="1.5"/><circle cx="7.5" cy="13.5" r="1.5"/>
                  </svg>
                </div>
                <div className="flex flex-1 items-start gap-2 py-2.5 pr-2 min-w-0">
                  <div style={{ flexShrink: 0, marginTop: 2 }}>
                    {favicon
                      ? <img src={favicon} alt="" className="w-4 h-4 rounded" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      : <div className="w-4 h-4 rounded bg-[--brand-dim]" />}
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
            );
          })}
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
  const data     = getExportData();
  const key      = encodeData(data);
  const shareUrl = buildShareUrl(data);
  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };
  const handleImport = () => {
    const parsed = decodeData(importText);
    if (!parsed) { alert("Invalid code or URL — please check and try again."); return; }
    const safe = (v) => Array.isArray(v) ? JSON.stringify(v) : typeof v === "string" ? v : null;
    if (parsed.sod      !== undefined) localStorage.setItem("tools-sod",      safe(parsed.sod)  ?? "[]");
    if (parsed.md       !== undefined) localStorage.setItem("tools-md",       safe(parsed.md)   ?? "[]");
    if (parsed.eod      !== undefined) localStorage.setItem("tools-eod",      safe(parsed.eod)  ?? "[]");
    if (parsed.notes    !== undefined) localStorage.setItem("notes",          parsed.notes      ?? "");
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
            <p className="text-[--text-muted] text-xs">Copy your backup code, or share a URL to restore on any machine — great for onboarding new starters.</p>
            <div>
              <label className="text-[--text-muted] text-xs uppercase tracking-widest block mb-1">Backup Code</label>
              <div className="flex gap-2">
                <input readOnly value={key} onClick={(e) => e.target.select()}
                  className="flex-1 bg-white/5 border border-[--card-border] rounded-lg px-2.5 py-2 text-xs text-[--text-secondary] focus:outline-none font-mono truncate" />
                <button onClick={() => copy(key, "code")} className={`${btnPrimary} px-3 py-2 rounded-lg text-xs font-medium text-white flex-shrink-0`}>
                  {copied === "code" ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
            <button onClick={() => copy(shareUrl, "url")}
              className={`w-full ${btnGhost} py-2.5 rounded-xl text-sm text-[--text-primary] flex items-center justify-center gap-2`}>
              <span>🔗</span><span>{copied === "url" ? "✓ URL Copied!" : "Copy Share URL"}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[--text-muted] text-xs">Paste a backup code or full share URL to restore your setup.</p>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste code or share URL here…" rows={4}
              className="w-full bg-white/5 border border-[--card-border] rounded-lg px-3 py-2 text-xs text-[--text-secondary] placeholder-[--text-muted] focus:outline-none focus:border-[--brand] resize-none font-mono" />
            <button onClick={handleImport} className={`w-full ${btnPrimary} py-2.5 rounded-xl font-medium text-white`}>Import & Reload</button>
          </div>
        )}
        <button onClick={onClose} className={`mt-3 w-full ${btnGhost} py-2 rounded-xl text-[--text-primary] text-sm`}>Close</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHIFT SCHEDULER
   Self-contained component. Rolling 7-day strip
   with real calendar dates. Items stored by
   ISO date key so nothing ever gets lost or
   confused with a different week's same weekday.
───────────────────────────────────────────── */
function ShiftScheduler({ tourRef, highlighted }) {
  const [schedule,    setSchedule]    = useState(() => JSON.parse(localStorage.getItem("schedule")) || {});
  const [selectedKey, setSelectedKey] = useState(null);
  const [newItem,     setNewItem]     = useState("");
  const [time,        setTime]        = useState(new Date());
  const week     = getRollingWeek();
  const todayKey = getDateKey(new Date());

  useEffect(() => { localStorage.setItem("schedule", JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const addItem = () => {
    if (!newItem.trim() || !selectedKey) return;
    const u = { ...schedule, [selectedKey]: [...(schedule[selectedKey] || []), newItem.trim()] };
    setSchedule(u); setNewItem("");
  };
  const deleteItem = (i) => {
    const u = { ...schedule, [selectedKey]: schedule[selectedKey].filter((_, idx) => idx !== i) };
    setSchedule(u);
  };

  const selectedItems = selectedKey ? (schedule[selectedKey] || []) : [];

  return (
    <div
      ref={tourRef}
      style={highlighted ? { zIndex: 60, position: "relative" } : {}}
      className={`${glass} p-4 rounded-2xl flex-shrink-0 transition-all duration-300 ${highlighted ? tourRingCls : ""}`}
    >
      {/* Live clock */}
      <div className="text-center font-mono text-base mb-1"
        style={{ color: "var(--text-primary)", filter: "drop-shadow(0 0 8px var(--brand-glow))" }}>
        {time.toLocaleTimeString()}
      </div>

      {/* Month + year label */}
      <div className="text-center text-[--text-muted] text-xs mb-2 tracking-wide">
        {new Date().toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
      </div>

      {/* Rolling 7-day strip */}
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
                isSelected
                  ? { background: "var(--brand)", boxShadow: "0 0 8px var(--brand-glow)" }
                  : isToday
                  ? { background: "var(--brand-dim)", border: "1px solid var(--brand-border)" }
                  : { background: "rgba(255,255,255,0.05)" }
              }>
              {/* Day abbr */}
              <span className="text-[10px] font-semibold leading-none"
                style={{ color: isSelected ? "#fff" : "var(--text-muted)" }}>
                {DAY_ABBR[date.getDay()]}
              </span>
              {/* Date number */}
              <span className="text-sm font-bold leading-tight mt-0.5"
                style={{ color: isSelected ? "#fff" : isToday ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {date.getDate()}
              </span>
              {/* Activity dot */}
              <div className="mt-0.5 h-1 w-1 rounded-full"
                style={{ background: hasItems ? (isSelected ? "rgba(255,255,255,0.9)" : "var(--brand-light)") : "transparent" }} />
            </div>
          );
        })}
      </div>

      {/* Selected date task list */}
      {selectedKey && (
        <div className="space-y-1.5 mt-2">
          <div className="text-[--text-muted] text-xs font-semibold uppercase tracking-widest mb-1">
            {new Date(selectedKey + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "short" })}
          </div>

          {selectedItems.length === 0 && (
            <p className="text-[--text-muted] text-xs italic py-1 px-0.5">No items yet — add one below.</p>
          )}

          {selectedItems.map((item, i) => (
            <div key={i} className="flex justify-between bg-white/5 border border-[--card-border] p-2 rounded-lg text-xs">
              <span className="text-[--text-primary] truncate pr-2">{item}</span>
              <button onClick={() => deleteItem(i)} className="text-red-400 hover:text-red-300 transition flex-shrink-0 text-xs">✕</button>
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
  const [notes,      setNotes]      = useState(() => localStorage.getItem("notes") || "");
  const [showShare,  setShowShare]  = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep,   setTourStep]   = useState(0);

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

  // Theme — default orange to match AustralianSuper brand
  const [themeId, setThemeId] = useState(() => localStorage.getItem("themeId") || "orange");
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  useEffect(() => { applyTheme(theme); }, [theme]);

  const bgImage  = theme.bg === "orange" ? bgOrange : bg;
  const bgFilter = theme.bg === "orange"
    ? "none"
    : `hue-rotate(${theme.hueRotate}deg) saturate(${theme.grayscale ? 0 : 1.1}) ${theme.grayscale ? "grayscale(1)" : ""}`.trim();

  // Detect share URL on load
  useEffect(() => {
    if (window.location.hash.startsWith("#key=")) {
      setShowShare(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // First-visit auto-tour
  useEffect(() => {
    if (!localStorage.getItem("hasVisited")) {
      localStorage.setItem("hasVisited", "1");
      const t = setTimeout(() => { setTourStep(0); setTourActive(true); }, 900);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => { localStorage.setItem("notes", notes); }, [notes]);

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
    if (!urls.length) { alert("No tools found in Start of Day or Main Day!"); return; }
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
      {tourActive && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 50, pointerEvents: "none" }} />}

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

          {/* Scripts & Notes */}
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
              placeholder={"Paste call scripts, talking points\nor shift notes here…"}
              className="bg-white/5 border border-[--card-border] p-2 rounded-xl flex-1 text-sm text-white placeholder-[--text-muted] focus:outline-none focus:border-[--brand] resize-none min-h-0 leading-relaxed"
            />
          </div>

          {/* Shift Scheduler */}
          <ShiftScheduler tourRef={refs.scheduler} highlighted={isTour("scheduler")} />
        </div>
      </div>

      {/* ⚡ BOOT UP MY DAY */}
      <button ref={refs["boot-btn"]} onClick={bootUpMyDay}
        className={`fixed bottom-6 left-6 flex items-center gap-2 ${btnPrimary} text-white font-semibold px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 ${isTour("boot-btn") ? tourRingCls : ""}`}
        style={{ zIndex: isTour("boot-btn") ? 60 : 20, boxShadow: "0 4px 24px var(--brand-glow)" }}>
        ⚡ Boot Up My Day
      </button>

      {showShare  && <ShareModal getExportData={getExportData} onClose={() => setShowShare(false)} />}

      {tourActive && (
        <TourTooltip step={currentStep} stepIndex={tourStep} total={TOUR_STEPS.length}
          onNext={nextStep} onPrev={prevStep} onClose={endTour} targetRef={currentStepRef} />
      )}
    </>
  );
}

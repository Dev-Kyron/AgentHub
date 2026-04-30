import { useState, useEffect, useRef } from "react";
import logo from "./assets/logo.png";
import bg from "./assets/bg.png";
import bgOrange from "./assets/bg_orange.png";

/* ─────────────────────────────────────────────
   THEMES
   Each theme defines real CSS colour tokens —
   no hue-rotate trickery, so favicons/icons
   are never distorted.
───────────────────────────────────────────── */
const THEMES = [
  {
    id: "purple",
    name: "Purple",
    hex: "#7c3aed",
    bg: null,               // uses default bg.png
    vars: {
      "--brand":          "#7c3aed",
      "--brand-light":    "#a78bfa",
      "--brand-dim":      "#4c1d95",
      "--brand-glow":     "rgba(124,58,237,0.55)",
      "--brand-ring":     "rgba(168,85,247,0.8)",
      "--brand-border":   "rgba(124,58,237,0.4)",
      "--brand-bg":       "rgba(124,58,237,0.08)",
      "--brand-hover-bg": "rgba(124,58,237,0.18)",
      "--text-primary":   "#e9d5ff",
      "--text-secondary": "rgba(216,180,254,0.7)",
      "--text-muted":     "rgba(196,167,255,0.45)",
      "--card-border":    "rgba(109,40,217,0.35)",
      "--card-bg":        "rgba(0,0,0,0.40)",
      "--overlay":        "rgba(0,0,0,0.38)",
      "--btn-primary-bg": "rgba(109,40,217,0.70)",
      "--btn-primary-hover":"rgba(124,58,237,0.85)",
    },
  },
  {
    id: "blue",
    name: "Blue",
    hex: "#1a56c4",
    bg: null,
    vars: {
      "--brand":          "#1a56c4",
      "--brand-light":    "#60a5fa",
      "--brand-dim":      "#1e3a8a",
      "--brand-glow":     "rgba(26,86,196,0.55)",
      "--brand-ring":     "rgba(59,130,246,0.8)",
      "--brand-border":   "rgba(26,86,196,0.4)",
      "--brand-bg":       "rgba(26,86,196,0.08)",
      "--brand-hover-bg": "rgba(26,86,196,0.18)",
      "--text-primary":   "#bfdbfe",
      "--text-secondary": "rgba(147,197,253,0.7)",
      "--text-muted":     "rgba(147,197,253,0.45)",
      "--card-border":    "rgba(30,64,175,0.35)",
      "--card-bg":        "rgba(0,0,0,0.40)",
      "--overlay":        "rgba(0,0,10,0.40)",
      "--btn-primary-bg": "rgba(30,64,175,0.70)",
      "--btn-primary-hover":"rgba(26,86,196,0.85)",
    },
  },
  {
    id: "red",
    name: "Red",
    hex: "#dc2626",
    bg: null,
    vars: {
      "--brand":          "#dc2626",
      "--brand-light":    "#f87171",
      "--brand-dim":      "#7f1d1d",
      "--brand-glow":     "rgba(220,38,38,0.55)",
      "--brand-ring":     "rgba(248,113,113,0.8)",
      "--brand-border":   "rgba(220,38,38,0.4)",
      "--brand-bg":       "rgba(220,38,38,0.08)",
      "--brand-hover-bg": "rgba(220,38,38,0.18)",
      "--text-primary":   "#fecaca",
      "--text-secondary": "rgba(252,165,165,0.7)",
      "--text-muted":     "rgba(252,165,165,0.45)",
      "--card-border":    "rgba(185,28,28,0.35)",
      "--card-bg":        "rgba(0,0,0,0.40)",
      "--overlay":        "rgba(10,0,0,0.40)",
      "--btn-primary-bg": "rgba(185,28,28,0.70)",
      "--btn-primary-hover":"rgba(220,38,38,0.85)",
    },
  },
  {
    id: "pink",
    name: "Pink",
    hex: "#db2777",
    bg: null,
    vars: {
      "--brand":          "#db2777",
      "--brand-light":    "#f472b6",
      "--brand-dim":      "#831843",
      "--brand-glow":     "rgba(219,39,119,0.55)",
      "--brand-ring":     "rgba(244,114,182,0.8)",
      "--brand-border":   "rgba(219,39,119,0.4)",
      "--brand-bg":       "rgba(219,39,119,0.08)",
      "--brand-hover-bg": "rgba(219,39,119,0.18)",
      "--text-primary":   "#fbcfe8",
      "--text-secondary": "rgba(249,168,212,0.7)",
      "--text-muted":     "rgba(249,168,212,0.45)",
      "--card-border":    "rgba(190,24,93,0.35)",
      "--card-bg":        "rgba(0,0,0,0.40)",
      "--overlay":        "rgba(8,0,4,0.40)",
      "--btn-primary-bg": "rgba(190,24,93,0.70)",
      "--btn-primary-hover":"rgba(219,39,119,0.85)",
    },
  },
  {
    id: "orange",
    name: "Orange",
    hex: "#e85d04",              // AustralianSuper-style burnt orange
    bg: "orange",               // signal to use bg_orange.png
    vars: {
      "--brand":          "#e85d04",
      "--brand-light":    "#fb8c00",
      "--brand-dim":      "#7c2d00",
      "--brand-glow":     "rgba(232,93,4,0.60)",
      "--brand-ring":     "rgba(251,140,0,0.85)",
      "--brand-border":   "rgba(232,93,4,0.45)",
      "--brand-bg":       "rgba(232,93,4,0.10)",
      "--brand-hover-bg": "rgba(232,93,4,0.22)",
      "--text-primary":   "#fed7aa",
      "--text-secondary": "rgba(253,186,116,0.75)",
      "--text-muted":     "rgba(253,186,116,0.45)",
      "--card-border":    "rgba(194,65,12,0.40)",
      "--card-bg":        "rgba(0,0,0,0.42)",
      "--overlay":        "rgba(10,3,0,0.42)",
      "--btn-primary-bg": "rgba(194,65,12,0.72)",
      "--btn-primary-hover":"rgba(234,88,12,0.88)",
    },
  },
  {
    id: "bw",
    name: "B & W",
    hex: "#6b7280",
    bg: null,
    vars: {
      "--brand":          "#9ca3af",
      "--brand-light":    "#e5e7eb",
      "--brand-dim":      "#374151",
      "--brand-glow":     "rgba(156,163,175,0.40)",
      "--brand-ring":     "rgba(209,213,219,0.7)",
      "--brand-border":   "rgba(107,114,128,0.35)",
      "--brand-bg":       "rgba(255,255,255,0.05)",
      "--brand-hover-bg": "rgba(255,255,255,0.12)",
      "--text-primary":   "#f3f4f6",
      "--text-secondary": "rgba(209,213,219,0.70)",
      "--text-muted":     "rgba(156,163,175,0.50)",
      "--card-border":    "rgba(75,85,99,0.40)",
      "--card-bg":        "rgba(0,0,0,0.45)",
      "--overlay":        "rgba(0,0,0,0.42)",
      "--btn-primary-bg": "rgba(55,65,81,0.72)",
      "--btn-primary-hover":"rgba(75,85,99,0.88)",
    },
  },
];

/* Apply theme CSS variables to :root */
function applyTheme(theme) {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getFavicon(url) {
  try {
    return `${new URL(url).origin}/favicon.ico`;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────
   SHARED STYLE HELPERS  (use CSS vars)
───────────────────────────────────────────── */
const glass =
  "bg-[--card-bg] backdrop-blur-md border border-[--card-border] shadow-lg shadow-black/40";

const btnPrimary =
  "bg-[--btn-primary-bg] hover:bg-[--btn-primary-hover] border border-[--brand-border] transition";

const btnGhost =
  "bg-white/10 hover:bg-white/20 backdrop-blur border border-[--card-border] transition";

const tourRingClass =
  "ring-2 ring-[--brand-ring] ring-offset-1 ring-offset-black/10 shadow-[0_0_18px_var(--brand-glow)]";

/* ─────────────────────────────────────────────
   THEME PICKER
───────────────────────────────────────────── */
function ThemePicker({ themeId, setThemeId }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (id) => {
    setThemeId(id);
    localStorage.setItem("themeId", id);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change theme"
        className={`flex items-center gap-2 ${btnGhost} px-3 py-1 rounded-lg text-sm`}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: current.hex,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span className="text-[--text-primary]">Theme</span>
        <span style={{ fontSize: 9, opacity: 0.6, marginLeft: 2 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          className={`${glass} absolute top-full right-0 mt-2 p-3 rounded-2xl`}
          style={{ width: 212, zIndex: 100 }}
        >
          <div className="text-[--text-muted] text-xs font-semibold uppercase tracking-widest mb-2 px-1">
            Brand Colour
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition ${
                  themeId === theme.id
                    ? "bg-[--brand-hover-bg] border border-[--brand-ring] text-[--text-primary]"
                    : "bg-[--brand-bg] hover:bg-[--brand-hover-bg] border border-transparent text-[--text-secondary]"
                }`}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: theme.hex,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {theme.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   TOUR STEPS
───────────────────────────────────────────── */
const TOUR_STEPS = [
  { id: "header",        title: "👋 Welcome to AgentHub!", body: "This quick tour will walk you through everything the app can do. Click Next to continue.", position: "bottom", align: "left" },
  { id: "start-of-day", title: "🌅 Start of Day",          body: "Add the tools and links you open every morning — standup boards, email, Slack, etc. Drag cards to reorder them.", position: "bottom", align: "left" },
  { id: "main-day",     title: "💼 Main Day",              body: "Your core working tools live here — project trackers, dashboards, docs. These stay open all day.", position: "bottom", align: "center" },
  { id: "end-of-day",   title: "🌙 End of Day",            body: "Wind-down tools go here — reporting, time tracking, anything you close out before logging off.", position: "bottom", align: "right" },
  { id: "boot-btn",     title: "⚡ Boot Up My Day",        body: "Opens every tool in Start of Day AND Main Day in new tabs with one click — your morning launch pad.", position: "top", align: "left" },
  { id: "notes",        title: "📝 Notes",                 body: "A persistent scratchpad that saves automatically. Jot down anything you need during your shift.", position: "left", align: "center" },
  { id: "scheduler",    title: "📅 Daily Scheduler",       body: "Click any day to expand it and add reminders or tasks. Today is always highlighted.", position: "left", align: "center" },
  { id: "export-import",title: "💾 Export & Import",       body: "Back up all your tools, notes and schedule as JSON — or import them to sync your setup on another machine.", position: "bottom", align: "right" },
  { id: "tour-btn",     title: "🎉 That's everything!",    body: "Replay this tour any time with the ? button. Happy hustling!", position: "bottom", align: "right" },
];

/* ─────────────────────────────────────────────
   TOUR TOOLTIP
───────────────────────────────────────────── */
function TourTooltip({ step, stepIndex, total, onNext, onPrev, onClose, targetRef }) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!targetRef?.current) return;
    const updatePos = () => {
      const rect = targetRef.current.getBoundingClientRect();
      const tH   = tooltipRef.current?.offsetHeight || 160;
      const tW   = tooltipRef.current?.offsetWidth  || 300;
      const gap  = 14;
      const align = step.align || "center";
      let top, left;

      if (step.position === "bottom") {
        top  = rect.bottom + gap;
        left = align === "left" ? rect.left : align === "right" ? rect.right - tW : rect.left + rect.width / 2 - tW / 2;
      } else if (step.position === "top") {
        top  = rect.top - tH - gap;
        left = align === "left" ? rect.left : align === "right" ? rect.right - tW : rect.left + rect.width / 2 - tW / 2;
      } else if (step.position === "left") {
        left = rect.left - tW - gap;
        top  = rect.top + rect.height / 2 - tH / 2;
      } else {
        left = rect.right + gap;
        top  = rect.top + rect.height / 2 - tH / 2;
      }

      left = Math.max(10, Math.min(left, window.innerWidth  - tW - 10));
      top  = Math.max(10, Math.min(top,  window.innerHeight - tH - 10));
      setCoords({ top, left });
    };

    updatePos();
    window.addEventListener("resize", updatePos);
    return () => window.removeEventListener("resize", updatePos);
  }, [step, targetRef]);

  return (
    <div
      ref={tooltipRef}
      style={{ position: "fixed", top: coords.top, left: coords.left, zIndex: 1000, width: 300 }}
      className="bg-black/90 backdrop-blur-xl border border-[--brand-border] rounded-2xl p-5 shadow-2xl shadow-black/60"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-[--text-primary] font-bold text-sm leading-snug pr-2">{step.title}</h3>
        <button onClick={onClose} className="text-[--text-secondary] hover:text-white text-xl leading-none transition flex-shrink-0">×</button>
      </div>
      <p className="text-[--text-secondary] text-xs leading-relaxed mb-4">{step.body}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                background: i === stepIndex ? "var(--brand-light)" : "var(--brand-dim)",
                width: i === stepIndex ? 12 : 6,
              }}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <button onClick={onPrev} className={`text-xs ${btnGhost} px-3 py-1.5 rounded-lg`}>Back</button>
          )}
          {stepIndex < total - 1 ? (
            <button onClick={onNext} className={`text-xs ${btnPrimary} px-3 py-1.5 rounded-lg font-medium text-white`}>Next →</button>
          ) : (
            <button onClick={onClose} className={`text-xs ${btnPrimary} px-3 py-1.5 rounded-lg font-medium text-white`}>Finish 🎉</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SECTION
───────────────────────────────────────────── */
function Section({ title, tourRef, highlighted }) {
  const storageKey = `tools-${title}`;
  const [tools, setTools]               = useState(() => JSON.parse(localStorage.getItem(storageKey)) || []);
  const [showModal, setShowModal]       = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [name, setName] = useState("");
  const [url,  setUrl]  = useState("");
  const [desc, setDesc] = useState("");
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOver,  setDragOver]  = useState(null);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(tools)); }, [tools]);

  const openAdd  = () => { setName(""); setUrl(""); setDesc(""); setEditingIndex(null); setShowModal(true); };
  const openEdit = (i, e) => {
    e.stopPropagation();
    const t = tools[i];
    setName(t.name); setUrl(t.url); setDesc(t.desc || "");
    setEditingIndex(i); setShowModal(true);
  };
  const saveTool = () => {
    if (!name || !url) return;
    const t = { name, url, desc };
    if (editingIndex !== null) { const u = [...tools]; u[editingIndex] = t; setTools(u); }
    else setTools([...tools, t]);
    setShowModal(false);
  };
  const deleteTool = (i, e) => { e.stopPropagation(); setTools(tools.filter((_, idx) => idx !== i)); };

  const handleDragStart = (e, i) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver  = (e, i) => { e.preventDefault(); setDragOver(i); };
  const handleDrop      = (i) => {
    if (dragIndex === null || dragIndex === i) { setDragIndex(null); setDragOver(null); return; }
    const u = [...tools];
    const d = u.splice(dragIndex, 1)[0];
    u.splice(i, 0, d);
    setTools(u); setDragIndex(null); setDragOver(null);
  };
  const handleDragEnd = () => { setDragIndex(null); setDragOver(null); };

  return (
    <div
      ref={tourRef}
      className={`${glass} rounded-2xl p-5 w-full h-full flex flex-col relative transition-all duration-300 ${highlighted ? tourRingClass : ""}`}
      style={highlighted ? { zIndex: 60 } : {}}
    >
      <h2 className="text-xs font-semibold mb-3 text-[--text-muted] tracking-widest uppercase flex-shrink-0">
        {title}
      </h2>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {tools.map((tool, index) => {
          const favicon = getFavicon(tool.url);
          return (
            <div
              key={index}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`bg-white/5 hover:bg-[--brand-bg] border rounded-xl flex items-start gap-0 transition ${
                dragOver === index && dragIndex !== index
                  ? "border-[--brand-light] bg-[--brand-hover-bg]"
                  : "border-[--card-border]"
              }`}
            >
              {/* Drag handle */}
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                title="Drag to reorder"
                className="flex items-center justify-center px-2 py-3 cursor-grab active:cursor-grabbing text-[--text-muted] hover:text-[--text-secondary] transition flex-shrink-0 self-stretch rounded-l-xl select-none"
                style={{ touchAction: "none" }}
              >
                <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                  <circle cx="2.5" cy="2.5"  r="1.5"/>
                  <circle cx="7.5" cy="2.5"  r="1.5"/>
                  <circle cx="2.5" cy="8"    r="1.5"/>
                  <circle cx="7.5" cy="8"    r="1.5"/>
                  <circle cx="2.5" cy="13.5" r="1.5"/>
                  <circle cx="7.5" cy="13.5" r="1.5"/>
                </svg>
              </div>

              {/* Content */}
              <div className="flex flex-1 items-start gap-2 py-2.5 pr-2 min-w-0">
                {/* Favicon — no filter so it stays true-colour */}
                <div style={{ flexShrink: 0, marginTop: 2 }}>
                  {favicon ? (
                    <img
                      src={favicon}
                      alt=""
                      className="w-4 h-4 rounded"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  ) : (
                    <div className="w-4 h-4 rounded bg-[--brand-dim]" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[--text-primary] hover:text-white font-medium text-sm transition truncate block"
                  >
                    {tool.name}
                  </a>
                  {tool.desc && (
                    <div className="text-xs text-[--text-muted] mt-0.5 truncate">{tool.desc}</div>
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => openEdit(index, e)}
                    className={`text-xs ${btnPrimary} px-2 py-0.5 rounded text-[--text-primary]`}
                  >Edit</button>
                  <button
                    onClick={(e) => deleteTool(index, e)}
                    className="text-xs bg-red-900/50 hover:bg-red-800/60 border border-red-700/40 px-2 py-0.5 rounded transition"
                  >Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={openAdd}
        className={`mt-auto pt-3 w-full ${btnPrimary} py-2 rounded-xl text-xs font-semibold tracking-wide flex-shrink-0 text-[--text-primary]`}
      >
        + Add Tool
      </button>

      {showModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
          <div className={`${glass} p-5 rounded-2xl w-full max-w-[260px] space-y-3`}>
            <h3 className="text-[--text-primary] font-semibold text-sm">
              {editingIndex !== null ? "Edit Tool" : "Add Tool"}
            </h3>
            {[
              { value: name, setter: setName, placeholder: "Name" },
              { value: url,  setter: setUrl,  placeholder: "URL"  },
            ].map(({ value, setter, placeholder }) => (
              <input
                key={placeholder}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="w-full p-2 bg-white/5 border border-[--card-border] rounded-lg text-sm text-white placeholder-[--text-muted] focus:outline-none focus:border-[--brand]"
              />
            ))}
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full p-2 bg-white/5 border border-[--card-border] rounded-lg text-sm text-white placeholder-[--text-muted] focus:outline-none focus:border-[--brand] resize-none"
            />
            <div className="flex gap-2">
              <button onClick={saveTool}            className={`flex-1 ${btnPrimary} py-2 rounded-lg text-sm font-medium text-white`}>Save</button>
              <button onClick={() => setShowModal(false)} className={`flex-1 ${btnGhost} py-2 rounded-lg text-sm text-[--text-primary]`}>Cancel</button>
            </div>
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
  const [notes,       setNotes]       = useState(() => localStorage.getItem("notes") || "");
  const [time,        setTime]        = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [schedule,    setSchedule]    = useState(() => JSON.parse(localStorage.getItem("schedule")) || {});
  const [newItem,     setNewItem]     = useState("");
  const [showExport,  setShowExport]  = useState(false);
  const [showImport,  setShowImport]  = useState(false);
  const [importText,  setImportText]  = useState("");
  const [tourActive,  setTourActive]  = useState(false);
  const [tourStep,    setTourStep]    = useState(0);

  // Theme — stored by id string, default "purple"
  const [themeId, setThemeId] = useState(
    () => localStorage.getItem("themeId") || "purple"
  );

  // Resolve theme object; apply CSS vars whenever it changes
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  useEffect(() => { applyTheme(theme); }, [theme]);

  // Background image: orange theme uses bg_orange.png
  const bgImage = theme.bg === "orange" ? bgOrange : bg;

  const refs = {
    header:          useRef(null),
    "start-of-day":  useRef(null),
    "main-day":      useRef(null),
    "end-of-day":    useRef(null),
    "boot-btn":      useRef(null),
    notes:           useRef(null),
    scheduler:       useRef(null),
    "export-import": useRef(null),
    "tour-btn":      useRef(null),
  };

  useEffect(() => { localStorage.setItem("notes",    notes);                   }, [notes]);
  useEffect(() => { localStorage.setItem("schedule", JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
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

  const getExportData = () =>
    JSON.stringify({
      sod:     localStorage.getItem("tools-Start of Day"),
      md:      localStorage.getItem("tools-Main Day"),
      eod:     localStorage.getItem("tools-End of Day"),
      notes,
      schedule,
      themeId,
    }, null, 2);

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      localStorage.setItem("tools-Start of Day", data.sod);
      localStorage.setItem("tools-Main Day",      data.md);
      localStorage.setItem("tools-End of Day",    data.eod);
      localStorage.setItem("notes",               data.notes);
      localStorage.setItem("schedule",            JSON.stringify(data.schedule));
      if (data.themeId)  localStorage.setItem("themeId",  data.themeId);
      // backward-compat: old exports used themeHue
      if (data.themeHue !== undefined && !data.themeId) {
        const legacyMap = { 0: "purple", "-60": "blue", 85: "red", 45: "pink", 145: "orange" };
        const mapped = legacyMap[String(data.themeHue)];
        if (mapped) localStorage.setItem("themeId", mapped);
      }
      location.reload();
    } catch { alert("Invalid JSON"); }
  };

  const addScheduleItem = () => {
    if (!newItem || !selectedDay) return;
    const u = { ...schedule };
    if (!u[selectedDay]) u[selectedDay] = [];
    u[selectedDay].push(newItem);
    setSchedule(u); setNewItem("");
  };

  const deleteScheduleItem = (i) => {
    const u = { ...schedule };
    u[selectedDay].splice(i, 1);
    setSchedule(u);
  };

  const bootUpMyDay = () => {
    const sod  = JSON.parse(localStorage.getItem("tools-Start of Day")) || [];
    const md   = JSON.parse(localStorage.getItem("tools-Main Day"))     || [];
    const urls = [...sod, ...md].map((t) => t.url).filter(Boolean);
    if (!urls.length) { alert("No tools found in Start of Day or Main Day!"); return; }
    urls.forEach((u) => window.open(u, "_blank"));
  };

  const days  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();

  return (
    <>
      {/* Background — swaps to bg_orange.png for orange theme */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
          transition: "background-image 0.4s ease",
        }}
      />
      {/* Dark overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--overlay)",
          zIndex: 1,
          transition: "background 0.35s ease",
        }}
      />

      {/* Tour dim */}
      {tourActive && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.48)",
            zIndex: 50,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Main layout */}
      <div
        className="text-white"
        style={{
          position: "relative",
          zIndex: 2,
          height: "100vh",
          display: "grid",
          gridTemplateRows: "auto 1fr",
          gridTemplateColumns: "1fr 272px",
          gap: "0 20px",
          padding: "28px 24px 90px 24px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          ref={refs.header}
          style={{ gridColumn: "1 / -1", marginBottom: 20, zIndex: isTour("header") ? 60 : "auto" }}
          className={`flex justify-between items-center transition-all duration-300 rounded-2xl ${isTour("header") ? `${tourRingClass} bg-white/5 px-3 py-2` : ""}`}
        >
          <div className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="AgentHub"
              className="w-9 h-9 object-contain group-hover:scale-110 transition"
              style={{ filter: "drop-shadow(0 0 10px var(--brand-glow))" }}
            />
            <h1 className="text-2xl font-bold tracking-tight">
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(to right, var(--brand-light), var(--brand))" }}
              >
                AgentHub
              </span>
            </h1>
          </div>

          <div className="flex gap-2 items-center">
            {/* Export / Import */}
            <div
              ref={refs["export-import"]}
              style={isTour("export-import") ? { zIndex: 60, position: "relative" } : {}}
              className={`flex gap-2 transition-all duration-300 ${isTour("export-import") ? `${tourRingClass} rounded-xl p-1` : ""}`}
            >
              <button onClick={() => setShowExport(true)} className={`${btnGhost} px-3 py-1 rounded-lg text-sm text-[--text-primary]`}>Export</button>
              <button onClick={() => setShowImport(true)} className={`${btnGhost} px-3 py-1 rounded-lg text-sm text-[--text-primary]`}>Import</button>
            </div>

            <ThemePicker themeId={themeId} setThemeId={setThemeId} />

            <button
              ref={refs["tour-btn"]}
              onClick={startTour}
              title="Guided tour"
              style={isTour("tour-btn") ? { zIndex: 60, position: "relative" } : {}}
              className={`w-8 h-8 flex items-center justify-center rounded-full ${btnPrimary} text-sm font-bold hover:scale-110 text-[--text-primary] ${isTour("tour-btn") ? tourRingClass : ""}`}
            >?</button>
          </div>
        </div>

        {/* LEFT: three columns */}
        <div style={{ gridRow: 2, gridColumn: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, minHeight: 0 }}>
          {[
            { title: "Start of Day", id: "start-of-day" },
            { title: "Main Day",     id: "main-day"     },
            { title: "End of Day",   id: "end-of-day"   },
          ].map(({ title, id }) => (
            <Section
              key={id}
              title={title}
              tourRef={refs[id]}
              highlighted={isTour(id)}
            />
          ))}
        </div>

        {/* RIGHT: notes + scheduler */}
        <div style={{ gridRow: 2, gridColumn: 2, display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>

          {/* Notes */}
          <div
            ref={refs.notes}
            style={isTour("notes") ? { zIndex: 60, position: "relative", flex: "1 1 0" } : { flex: "1 1 0" }}
            className={`${glass} p-4 rounded-2xl flex flex-col min-h-0 transition-all duration-300 ${isTour("notes") ? tourRingClass : ""}`}
          >
            <h2 className="text-[--text-muted] font-semibold text-xs uppercase tracking-widest mb-2">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot something down..."
              className="bg-white/5 border border-[--card-border] p-2 rounded-xl flex-1 text-sm text-white placeholder-[--text-muted] focus:outline-none focus:border-[--brand] resize-none min-h-0"
            />
          </div>

          {/* Scheduler */}
          <div
            ref={refs.scheduler}
            style={isTour("scheduler") ? { zIndex: 60, position: "relative" } : {}}
            className={`${glass} p-4 rounded-2xl flex-shrink-0 transition-all duration-300 ${isTour("scheduler") ? tourRingClass : ""}`}
          >
            <div
              className="text-center font-mono text-base mb-3"
              style={{
                color: "var(--text-primary)",
                filter: "drop-shadow(0 0 8px var(--brand-glow))",
              }}
            >
              {time.toLocaleTimeString()}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {days.map((day, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  className="text-center py-1 rounded-lg cursor-pointer transition text-xs font-semibold"
                  style={
                    selectedDay === day
                      ? { background: "var(--brand)", color: "#fff", boxShadow: "0 0 8px var(--brand-glow)" }
                      : i === today
                      ? { background: "var(--brand-dim)", color: "var(--text-primary)", border: "1px solid var(--brand-border)" }
                      : { background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }
                  }
                >
                  {day}
                </div>
              ))}
            </div>
            {selectedDay && (
              <div className="space-y-1.5">
                {(schedule[selectedDay] || []).map((item, i) => (
                  <div key={i} className="flex justify-between bg-white/5 border border-[--card-border] p-2 rounded-lg text-xs">
                    <span className="text-[--text-primary] truncate pr-2">{item}</span>
                    <button onClick={() => deleteScheduleItem(i)} className="text-red-400 hover:text-red-300 transition flex-shrink-0">❌</button>
                  </div>
                ))}
                <div className="flex gap-1">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addScheduleItem()}
                    placeholder="Add item..."
                    className="flex-1 p-1.5 bg-white/5 border border-[--card-border] rounded-lg text-xs text-white placeholder-[--text-muted] focus:outline-none focus:border-[--brand]"
                  />
                  <button
                    onClick={addScheduleItem}
                    className={`${btnPrimary} px-3 rounded-lg text-xs font-bold text-white`}
                  >+</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ⚡ BOOT UP MY DAY */}
      <button
        ref={refs["boot-btn"]}
        onClick={bootUpMyDay}
        className={`fixed bottom-6 left-6 flex items-center gap-2 ${btnPrimary} text-white font-semibold px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 ${isTour("boot-btn") ? tourRingClass : ""}`}
        style={{
          zIndex: isTour("boot-btn") ? 60 : 20,
          boxShadow: "0 4px 24px var(--brand-glow)",
        }}
      >
        ⚡ Boot Up My Day
      </button>

      {/* EXPORT MODAL */}
      {showExport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
          <div className={`${glass} p-6 rounded-2xl w-[400px]`}>
            <h3 className="text-[--text-primary] font-semibold mb-3">Export Data</h3>
            <textarea
              value={getExportData()}
              readOnly
              className="w-full h-40 bg-white/5 border border-[--card-border] p-2 rounded-lg text-xs text-[--text-secondary] focus:outline-none resize-none"
            />
            <button onClick={() => navigator.clipboard.writeText(getExportData())} className={`mt-3 w-full ${btnPrimary} py-2 rounded-xl font-medium text-white`}>Copy to Clipboard</button>
            <button onClick={() => setShowExport(false)} className={`mt-2 w-full ${btnGhost} py-2 rounded-xl text-[--text-primary]`}>Close</button>
          </div>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
          <div className={`${glass} p-6 rounded-2xl w-[400px]`}>
            <h3 className="text-[--text-primary] font-semibold mb-3">Import Data</h3>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste exported JSON here..."
              className="w-full h-40 bg-white/5 border border-[--card-border] p-2 rounded-lg text-xs text-[--text-secondary] placeholder-[--text-muted] focus:outline-none focus:border-[--brand] resize-none"
            />
            <button onClick={handleImport}            className={`mt-3 w-full ${btnPrimary} py-2 rounded-xl font-medium text-white`}>Import</button>
            <button onClick={() => setShowImport(false)} className={`mt-2 w-full ${btnGhost} py-2 rounded-xl text-[--text-primary]`}>Cancel</button>
          </div>
        </div>
      )}

      {/* TOUR TOOLTIP */}
      {tourActive && (
        <TourTooltip
          step={currentStep}
          stepIndex={tourStep}
          total={TOUR_STEPS.length}
          onNext={nextStep}
          onPrev={prevStep}
          onClose={endTour}
          targetRef={currentStepRef}
        />
      )}
    </>
  );
}

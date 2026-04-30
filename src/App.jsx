import { useState, useEffect, useRef } from "react";
import logo from "./assets/logo.png";
import bg from "./assets/bg.png";

/* ---------- ICON HELPER ---------- */
function getFavicon(url) {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch {
    return null;
  }
}

/* ---------- SHARED STYLES ---------- */
const glass = "bg-black/40 backdrop-blur-md border border-purple-900/40 shadow-lg shadow-black/40";

/* ---------- TOUR STEPS ---------- */
const TOUR_STEPS = [
  {
    id: "header",
    title: "👋 Welcome to AgentHub!",
    body: "This quick tour will walk you through everything the app can do. Click Next to continue.",
    position: "bottom",
    align: "left",
  },
  {
    id: "start-of-day",
    title: "🌅 Start of Day",
    body: "Add the tools and links you open every morning — standup boards, email, Slack, etc. Drag cards to reorder them.",
    position: "bottom",
    align: "left",
  },
  {
    id: "main-day",
    title: "💼 Main Day",
    body: "Your core working tools live here — project trackers, dashboards, docs. These stay open all day.",
    position: "bottom",
    align: "center",
  },
  {
    id: "end-of-day",
    title: "🌙 End of Day",
    body: "Wind-down tools go here — reporting, time tracking, anything you close out before logging off.",
    position: "bottom",
    align: "right",
  },
  {
    id: "boot-btn",
    title: "⚡ Boot Up My Day",
    body: "Opens every tool in Start of Day AND Main Day in new tabs with one click — your morning launch pad.",
    position: "top",
    align: "left",
  },
  {
    id: "notes",
    title: "📝 Notes",
    body: "A persistent scratchpad that saves automatically. Jot down anything you need during your shift.",
    position: "left",
    align: "center",
  },
  {
    id: "scheduler",
    title: "📅 Daily Scheduler",
    body: "Click any day to expand it and add reminders or tasks. Today is always highlighted.",
    position: "left",
    align: "center",
  },
  {
    id: "export-import",
    title: "💾 Export & Import",
    body: "Back up all your tools, notes and schedule as JSON — or import them to sync your setup on another machine.",
    position: "bottom",
    align: "right",
  },
  {
    id: "tour-btn",
    title: "🎉 That's everything!",
    body: "Replay this tour any time with the ? button. Happy hustling!",
    position: "bottom",
    align: "right",
  },
];

/* ---------- TOUR TOOLTIP ---------- */
function TourTooltip({ step, stepIndex, total, onNext, onPrev, onClose, targetRef }) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!targetRef?.current) return;

    const updatePos = () => {
      const rect  = targetRef.current.getBoundingClientRect();
      const tH    = tooltipRef.current?.offsetHeight || 160;
      const tW    = tooltipRef.current?.offsetWidth  || 300;
      const gap   = 14;
      const align = step.align || "center";
      let top, left;

      if (step.position === "bottom") {
        top  = rect.bottom + gap;
        left = align === "left"  ? rect.left
             : align === "right" ? rect.right - tW
             : rect.left + rect.width / 2 - tW / 2;
      } else if (step.position === "top") {
        top  = rect.top - tH - gap;
        left = align === "left"  ? rect.left
             : align === "right" ? rect.right - tW
             : rect.left + rect.width / 2 - tW / 2;
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
      className="bg-black/90 backdrop-blur-xl border border-purple-500/60 rounded-2xl p-5 shadow-2xl shadow-purple-900/60"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-purple-100 font-bold text-sm leading-snug pr-2">{step.title}</h3>
        <button onClick={onClose} className="text-purple-400 hover:text-white text-xl leading-none transition flex-shrink-0">×</button>
      </div>
      <p className="text-purple-200/80 text-xs leading-relaxed mb-4">{step.body}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === stepIndex ? "bg-purple-400 w-3" : "bg-purple-800 w-1.5"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <button onClick={onPrev} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition">Back</button>
          )}
          {stepIndex < total - 1 ? (
            <button onClick={onNext} className="text-xs bg-purple-700/80 hover:bg-purple-600 px-3 py-1.5 rounded-lg transition font-medium">Next →</button>
          ) : (
            <button onClick={onClose} className="text-xs bg-purple-600 hover:bg-purple-500 px-3 py-1.5 rounded-lg transition font-medium">Finish 🎉</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- SECTION ---------- */
function Section({ title, tourRef, highlighted, tourRing }) {
  const storageKey = `tools-${title}`;
  const [tools, setTools]               = useState(() => JSON.parse(localStorage.getItem(storageKey)) || []);
  const [showModal, setShowModal]       = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [name, setName] = useState("");
  const [url,  setUrl]  = useState("");
  const [desc, setDesc] = useState("");
  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(tools)); }, [tools]);

  const openAdd  = () => { setName(""); setUrl(""); setDesc(""); setEditingIndex(null); setShowModal(true); };
  const openEdit = (i) => {
    const t = tools[i];
    setName(t.name); setUrl(t.url); setDesc(t.desc || "");
    setEditingIndex(i);
    setShowModal(true);
  };
  const saveTool = () => {
    if (!name || !url) return;
    const t = { name, url, desc };
    if (editingIndex !== null) { const u = [...tools]; u[editingIndex] = t; setTools(u); }
    else setTools([...tools, t]);
    setShowModal(false);
  };
  const deleteTool      = (i) => setTools(tools.filter((_, idx) => idx !== i));
  const handleDragStart = (i) => setDragIndex(i);
  const handleDrop      = (i) => {
    if (dragIndex === null) return;
    const u = [...tools];
    const d = u.splice(dragIndex, 1)[0];
    u.splice(i, 0, d);
    setTools(u);
    setDragIndex(null);
  };

  return (
    /*
      h-full  →  card fills the full height of its grid cell
      flex-col →  children stack vertically
      The tool list gets flex-1 so it expands to fill space,
      pushing the "+ Add Tool" button to the very bottom.
    */
    <div
      ref={tourRef}
      className={`${glass} rounded-2xl p-5 w-full h-full flex flex-col relative transition-all duration-300 ${highlighted ? `${tourRing}` : ""}`}
      style={highlighted ? { zIndex: 60 } : {}}
    >
      <h2 className="text-xs font-semibold mb-3 text-purple-300 tracking-widest uppercase flex-shrink-0">
        {title}
      </h2>

      {/* Tool list — grows to fill available space */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
        {tools.map((tool, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="bg-white/5 hover:bg-white/10 border border-purple-800/30 p-3 rounded-xl flex justify-between items-start gap-2 cursor-move transition"
          >
            <div className="flex gap-2 items-start min-w-0">
              <img src={getFavicon(tool.url)} alt="" className="w-4 h-4 mt-0.5 rounded flex-shrink-0" />
              <div className="min-w-0">
                <a
                  href={tool.url}
                  target="_blank"
                  className="text-purple-300 hover:text-purple-100 font-medium text-sm transition truncate block"
                >
                  {tool.name}
                </a>
                {tool.desc && (
                  <div className="text-xs text-purple-400/60 mt-0.5 truncate">{tool.desc}</div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={() => openEdit(index)} className="text-xs bg-purple-900/50 hover:bg-purple-800/60 border border-purple-700/40 px-2 py-0.5 rounded transition">Edit</button>
              <button onClick={() => deleteTool(index)} className="text-xs bg-red-900/50 hover:bg-red-800/60 border border-red-700/40 px-2 py-0.5 rounded transition">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Tool — pinned to bottom via mt-auto */}
      <button
        onClick={openAdd}
        className="mt-auto pt-3 w-full bg-purple-700/60 hover:bg-purple-600/70 border border-purple-500/40 py-2 rounded-xl transition text-xs font-semibold tracking-wide flex-shrink-0"
      >
        + Add Tool
      </button>

      {showModal && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
          <div className={`${glass} p-5 rounded-2xl w-full max-w-[260px] space-y-3`}>
            <h3 className="text-purple-200 font-semibold text-sm">
              {editingIndex !== null ? "Edit Tool" : "Add Tool"}
            </h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full p-2 bg-white/5 border border-purple-800/40 rounded-lg text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL"
              className="w-full p-2 bg-white/5 border border-purple-800/40 rounded-lg text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500"
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full p-2 bg-white/5 border border-purple-800/40 rounded-lg text-sm text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={saveTool} className="flex-1 bg-purple-700/70 hover:bg-purple-600/80 py-2 rounded-lg transition text-sm font-medium">Save</button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg transition text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- APP ---------- */
export default function App() {
  const [notes, setNotes]             = useState(() => localStorage.getItem("notes") || "");
  const [time,  setTime]              = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [schedule, setSchedule]       = useState(() => JSON.parse(localStorage.getItem("schedule")) || {});
  const [newItem, setNewItem]         = useState("");
  const [showExport, setShowExport]   = useState(false);
  const [showImport, setShowImport]   = useState(false);
  const [importText, setImportText]   = useState("");
  const [tourActive, setTourActive]   = useState(false);
  const [tourStep,   setTourStep]     = useState(0);

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

  useEffect(() => { localStorage.setItem("notes", notes); }, [notes]);
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
  const isTour  = (id) => tourActive && currentStep?.id === id;
  const tourRing = "ring-2 ring-purple-400 ring-offset-1 ring-offset-black/10 shadow-[0_0_18px_rgba(168,85,247,0.55)]";

  const getExportData = () => JSON.stringify({
    sod: localStorage.getItem("tools-Start of Day"),
    md:  localStorage.getItem("tools-Main Day"),
    eod: localStorage.getItem("tools-End of Day"),
    notes, schedule,
  }, null, 2);

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      localStorage.setItem("tools-Start of Day", data.sod);
      localStorage.setItem("tools-Main Day", data.md);
      localStorage.setItem("tools-End of Day", data.eod);
      localStorage.setItem("notes", data.notes);
      localStorage.setItem("schedule", JSON.stringify(data.schedule));
      location.reload();
    } catch { alert("Invalid JSON"); }
  };

  const addScheduleItem = () => {
    if (!newItem || !selectedDay) return;
    const u = { ...schedule };
    if (!u[selectedDay]) u[selectedDay] = [];
    u[selectedDay].push(newItem);
    setSchedule(u);
    setNewItem("");
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
      {/* ── Background ── */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: `url(${bg})`, backgroundSize: "cover", backgroundPosition: "center", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)", zIndex: 1 }} />

      {/* ── Tour dim overlay ── */}
      {tourActive && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 50, pointerEvents: "none" }} />
      )}

      {/* ── Main layout ── */}
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
        {/* ── HEADER ── */}
        <div
          ref={refs.header}
          style={{ gridColumn: "1 / -1", marginBottom: 20, zIndex: isTour("header") ? 60 : "auto" }}
          className={`flex justify-between items-center transition-all duration-300 rounded-2xl ${isTour("header") ? `${tourRing} bg-white/5 px-3 py-2` : ""}`}
        >
          <div className="flex items-center gap-3 group">
            <img src={logo} alt="AgentHub" className="w-9 h-9 object-contain group-hover:scale-110 transition drop-shadow-[0_0_10px_rgba(168,85,247,0.9)]" />
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-purple-300 to-purple-600 bg-clip-text text-transparent">AgentHub</span>
            </h1>
          </div>
          <div className="flex gap-2 items-center">
            <div
              ref={refs["export-import"]}
              style={isTour("export-import") ? { zIndex: 60, position: "relative" } : {}}
              className={`flex gap-2 transition-all duration-300 ${isTour("export-import") ? `${tourRing} rounded-xl p-1` : ""}`}
            >
              <button onClick={() => setShowExport(true)} className="bg-white/10 hover:bg-white/20 backdrop-blur border border-purple-800/40 px-3 py-1 rounded-lg text-sm transition">Export</button>
              <button onClick={() => setShowImport(true)} className="bg-white/10 hover:bg-white/20 backdrop-blur border border-purple-800/40 px-3 py-1 rounded-lg text-sm transition">Import</button>
            </div>
            <button
              ref={refs["tour-btn"]}
              onClick={startTour}
              title="Guided tour"
              style={isTour("tour-btn") ? { zIndex: 60, position: "relative" } : {}}
              className={`w-8 h-8 flex items-center justify-center rounded-full bg-purple-700/60 hover:bg-purple-600/80 border border-purple-500/40 text-sm font-bold transition hover:scale-110 ${isTour("tour-btn") ? tourRing : ""}`}
            >?</button>
          </div>
        </div>

        {/* ── LEFT: three section columns ── */}
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
              tourRing={tourRing}
            />
          ))}
        </div>

        {/* ── RIGHT: notes + scheduler ── */}
        <div style={{ gridRow: 2, gridColumn: 2, display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>

          {/* Notes */}
          <div
            ref={refs.notes}
            style={isTour("notes") ? { zIndex: 60, position: "relative", flex: "1 1 0" } : { flex: "1 1 0" }}
            className={`${glass} p-4 rounded-2xl flex flex-col min-h-0 transition-all duration-300 ${isTour("notes") ? tourRing : ""}`}
          >
            <h2 className="text-purple-300 font-semibold text-xs uppercase tracking-widest mb-2">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot something down..."
              className="bg-white/5 border border-purple-900/30 p-2 rounded-xl flex-1 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-500 resize-none min-h-0"
            />
          </div>

          {/* Scheduler */}
          <div
            ref={refs.scheduler}
            style={isTour("scheduler") ? { zIndex: 60, position: "relative" } : {}}
            className={`${glass} p-4 rounded-2xl flex-shrink-0 transition-all duration-300 ${isTour("scheduler") ? tourRing : ""}`}
          >
            <div className="text-center text-purple-200 font-mono text-base mb-3 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]">
              {time.toLocaleTimeString()}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {days.map((day, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  className={`text-center py-1 rounded-lg cursor-pointer transition text-xs font-semibold ${
                    selectedDay === day
                      ? "bg-purple-600/80 text-white shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                      : i === today
                      ? "bg-purple-800/60 text-purple-200 border border-purple-600/40"
                      : "bg-white/5 hover:bg-white/10 text-purple-300/70"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
            {selectedDay && (
              <div className="space-y-1.5">
                {(schedule[selectedDay] || []).map((item, i) => (
                  <div key={i} className="flex justify-between bg-white/5 border border-purple-900/30 p-2 rounded-lg text-xs">
                    <span className="text-purple-100 truncate pr-2">{item}</span>
                    <button onClick={() => deleteScheduleItem(i)} className="text-red-400 hover:text-red-300 transition flex-shrink-0">❌</button>
                  </div>
                ))}
                <div className="flex gap-1">
                  <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addScheduleItem()}
                    placeholder="Add item..."
                    className="flex-1 p-1.5 bg-white/5 border border-purple-800/40 rounded-lg text-xs text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-500"
                  />
                  <button onClick={addScheduleItem} className="bg-purple-700/70 hover:bg-purple-600/80 px-3 rounded-lg text-xs transition font-bold">+</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ⚡ BOOT UP MY DAY ── */}
      <button
        ref={refs["boot-btn"]}
        onClick={bootUpMyDay}
        className={`fixed bottom-6 left-6 flex items-center gap-2 bg-purple-700/75 hover:bg-purple-600/85 backdrop-blur-md border border-purple-400/30 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-purple-900/60 transition-all hover:scale-105 active:scale-95 ${isTour("boot-btn") ? tourRing : ""}`}
        style={{ zIndex: isTour("boot-btn") ? 60 : 20 }}
      >
        ⚡ Boot Up My Day
      </button>

      {/* ── EXPORT MODAL ── */}
      {showExport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
          <div className={`${glass} p-6 rounded-2xl w-[400px]`}>
            <h3 className="text-purple-200 font-semibold mb-3">Export Data</h3>
            <textarea value={getExportData()} readOnly className="w-full h-40 bg-white/5 border border-purple-800/40 p-2 rounded-lg text-xs text-purple-200 focus:outline-none resize-none" />
            <button onClick={() => navigator.clipboard.writeText(getExportData())} className="mt-3 w-full bg-purple-700/70 hover:bg-purple-600/80 py-2 rounded-xl transition font-medium">Copy to Clipboard</button>
            <button onClick={() => setShowExport(false)} className="mt-2 w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl transition">Close</button>
          </div>
        </div>
      )}

      {/* ── IMPORT MODAL ── */}
      {showImport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
          <div className={`${glass} p-6 rounded-2xl w-[400px]`}>
            <h3 className="text-purple-200 font-semibold mb-3">Import Data</h3>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="Paste exported JSON here..." className="w-full h-40 bg-white/5 border border-purple-800/40 p-2 rounded-lg text-xs text-purple-200 placeholder-purple-400/40 focus:outline-none focus:border-purple-500 resize-none" />
            <button onClick={handleImport} className="mt-3 w-full bg-purple-700/70 hover:bg-purple-600/80 py-2 rounded-xl transition font-medium">Import</button>
            <button onClick={() => setShowImport(false)} className="mt-2 w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl transition">Cancel</button>
          </div>
        </div>
      )}

      {/* ── TOUR TOOLTIP ── */}
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

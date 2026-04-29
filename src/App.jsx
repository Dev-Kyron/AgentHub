import { useState, useEffect } from "react";
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

/* ---------- GLASS CARD STYLE ---------- */
const glass =
  "bg-black/40 backdrop-blur-md border border-purple-900/40 shadow-lg shadow-black/40";

/* ---------- SECTION ---------- */
function Section({ title }) {
  const storageKey = `tools-${title}`;

  const [tools, setTools] = useState(() => {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  });

  const [showModal, setShowModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");

  const [dragIndex, setDragIndex] = useState(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tools));
  }, [tools]);

  const openAdd = () => {
    setName(""); setUrl(""); setDesc("");
    setEditingIndex(null);
    setShowModal(true);
  };

  const openEdit = (index) => {
    const tool = tools[index];
    setName(tool.name); setUrl(tool.url); setDesc(tool.desc || "");
    setEditingIndex(index);
    setShowModal(true);
  };

  const saveTool = () => {
    if (!name || !url) return;
    const newTool = { name, url, desc };
    if (editingIndex !== null) {
      const updated = [...tools];
      updated[editingIndex] = newTool;
      setTools(updated);
    } else {
      setTools([...tools, newTool]);
    }
    setShowModal(false);
  };

  const deleteTool = (index) => setTools(tools.filter((_, i) => i !== index));

  const handleDragStart = (index) => setDragIndex(index);
  const handleDrop = (index) => {
    if (dragIndex === null) return;
    const updated = [...tools];
    const dragged = updated.splice(dragIndex, 1)[0];
    updated.splice(index, 0, dragged);
    setTools(updated);
    setDragIndex(null);
  };

  return (
    <div className={`${glass} rounded-2xl p-6 w-full relative`}>
      <h2 className="text-base font-semibold mb-4 text-purple-200 tracking-wide uppercase">
        {title}
      </h2>

      <div className="space-y-3">
        {tools.map((tool, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="bg-white/5 hover:bg-white/10 border border-purple-800/30 p-3 rounded-xl flex justify-between items-start gap-3 cursor-move transition"
          >
            <div className="flex gap-3 items-start">
              <img
                src={getFavicon(tool.url)}
                alt=""
                className="w-5 h-5 mt-1 rounded"
              />
              <div>
                <a
                  href={tool.url}
                  target="_blank"
                  className="text-purple-300 hover:text-purple-100 font-medium transition"
                >
                  {tool.name}
                </a>
                {tool.desc && (
                  <div className="text-xs text-purple-400/70 mt-1">{tool.desc}</div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => openEdit(index)}
                className="text-xs bg-purple-900/50 hover:bg-purple-800/60 border border-purple-700/40 px-2 py-1 rounded transition"
              >
                Edit
              </button>
              <button
                onClick={() => deleteTool(index)}
                className="text-xs bg-red-900/50 hover:bg-red-800/60 border border-red-700/40 px-2 py-1 rounded transition"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={openAdd}
        className="mt-4 w-full bg-purple-700/60 hover:bg-purple-600/70 border border-purple-500/40 py-2 rounded-xl transition text-sm font-medium"
      >
        + Add Tool
      </button>

      {showModal && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
          <div className={`${glass} p-6 rounded-2xl w-full max-w-xs space-y-4`}>
            <h3 className="text-purple-200 font-semibold">
              {editingIndex !== null ? "Edit Tool" : "Add Tool"}
            </h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full p-2 bg-white/5 border border-purple-800/40 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL"
              className="w-full p-2 bg-white/5 border border-purple-800/40 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500"
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description"
              className="w-full p-2 bg-white/5 border border-purple-800/40 rounded-lg text-white placeholder-purple-400/50 focus:outline-none focus:border-purple-500"
            />
            <div className="flex gap-2">
              <button onClick={saveTool} className="flex-1 bg-purple-700/70 hover:bg-purple-600/80 py-2 rounded-lg transition font-medium">
                Save
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- APP ---------- */
export default function App() {
  const [notes, setNotes] = useState(() => localStorage.getItem("notes") || "");
  const [time, setTime] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [schedule, setSchedule] = useState(() => {
    return JSON.parse(localStorage.getItem("schedule")) || {};
  });
  const [newItem, setNewItem] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  useEffect(() => { localStorage.setItem("notes", notes); }, [notes]);
  useEffect(() => { localStorage.setItem("schedule", JSON.stringify(schedule)); }, [schedule]);
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getExportData = () =>
    JSON.stringify({
      sod: localStorage.getItem("tools-Start of Day"),
      md: localStorage.getItem("tools-Main Day"),
      eod: localStorage.getItem("tools-End of Day"),
      notes,
      schedule,
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
    } catch {
      alert("Invalid data");
    }
  };

  const addScheduleItem = () => {
    if (!newItem || !selectedDay) return;
    const updated = { ...schedule };
    if (!updated[selectedDay]) updated[selectedDay] = [];
    updated[selectedDay].push(newItem);
    setSchedule(updated);
    setNewItem("");
  };

  const deleteScheduleItem = (index) => {
    const updated = { ...schedule };
    updated[selectedDay].splice(index, 1);
    setSchedule(updated);
  };

  const bootUpMyDay = () => {
    const sodTools = JSON.parse(localStorage.getItem("tools-Start of Day")) || [];
    const mdTools  = JSON.parse(localStorage.getItem("tools-Main Day"))     || [];
    const allUrls  = [...sodTools, ...mdTools].map((t) => t.url).filter(Boolean);
    if (allUrls.length === 0) { alert("No tools found in Start of Day or Main Day!"); return; }
    allUrls.forEach((url) => window.open(url, "_blank"));
  };

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();

  return (
    <>
      {/* Full-screen background — sits behind everything */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />
      {/* Subtle dark overlay for readability */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1 }} />

      {/* App content */}
      <div className="min-h-screen text-white flex gap-8 p-10 relative" style={{ zIndex: 2 }}>

        {/* LEFT */}
        <div className="flex-1">

          {/* HEADER */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4 group">
              <img
                src={logo}
                alt="AgentHub Logo"
                className="w-10 h-10 object-contain transition group-hover:scale-110 drop-shadow-[0_0_12px_rgba(168,85,247,0.9)]"
              />
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-purple-300 to-purple-600 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                  AgentHub
                </span>
              </h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowExport(true)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur border border-purple-800/40 px-3 py-1 rounded-lg text-sm transition"
              >
                Export
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="bg-white/10 hover:bg-white/20 backdrop-blur border border-purple-800/40 px-3 py-1 rounded-lg text-sm transition"
              >
                Import
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <Section title="Start of Day" />
            <Section title="Main Day" />
            <Section title="End of Day" />
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-80 flex flex-col h-[calc(100vh-80px)]">

          <div className={`${glass} p-4 rounded-2xl flex flex-col flex-1`}>
            <h2 className="text-purple-200 font-semibold mb-2 text-sm uppercase tracking-wide">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jot something down..."
              className="bg-white/5 border border-purple-900/30 p-2 rounded-xl flex-1 text-sm text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className={`mt-4 ${glass} p-4 rounded-2xl`}>
            <div className="text-center text-purple-200 font-mono text-lg mb-3 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
              {time.toLocaleTimeString()}
            </div>

            <div className="flex justify-between text-xs mb-3 gap-1">
              {days.map((day, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                  className={`flex-1 text-center py-1 rounded-lg cursor-pointer transition font-medium ${
                    selectedDay === day
                      ? "bg-purple-600/80 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                      : i === today
                      ? "bg-purple-800/50 text-purple-200 border border-purple-600/40"
                      : "bg-white/5 hover:bg-white/10 text-purple-300/70"
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            {selectedDay && (
              <div className="space-y-2">
                {(schedule[selectedDay] || []).map((item, i) => (
                  <div key={i} className="flex justify-between bg-white/5 border border-purple-900/30 p-2 rounded-lg text-xs">
                    <span className="text-purple-100">{item}</span>
                    <button onClick={() => deleteScheduleItem(i)} className="text-red-400 hover:text-red-300 transition">❌</button>
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
                  <button
                    onClick={addScheduleItem}
                    className="bg-purple-700/70 hover:bg-purple-600/80 px-3 rounded-lg text-xs transition"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ⚡ BOOT UP MY DAY */}
        <button
          onClick={bootUpMyDay}
          className="fixed bottom-6 left-6 z-20 flex items-center gap-2 bg-purple-700/70 hover:bg-purple-600/80 backdrop-blur-md border border-purple-400/30 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg shadow-purple-900/60 transition-all hover:scale-105 active:scale-95"
        >
          ⚡ Boot Up My Day
        </button>

        {/* EXPORT MODAL */}
        {showExport && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
            <div className={`${glass} p-6 rounded-2xl w-[400px]`}>
              <h3 className="text-purple-200 font-semibold mb-3">Export Data</h3>
              <textarea value={getExportData()} readOnly className="w-full h-40 bg-white/5 border border-purple-800/40 p-2 rounded-lg text-xs text-purple-200 focus:outline-none" />
              <button
                onClick={() => navigator.clipboard.writeText(getExportData())}
                className="mt-3 w-full bg-purple-700/70 hover:bg-purple-600/80 py-2 rounded-xl transition font-medium"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => setShowExport(false)}
                className="mt-2 w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* IMPORT MODAL */}
        {showImport && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
            <div className={`${glass} p-6 rounded-2xl w-[400px]`}>
              <h3 className="text-purple-200 font-semibold mb-3">Import Data</h3>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste exported JSON here..."
                className="w-full h-40 bg-white/5 border border-purple-800/40 p-2 rounded-lg text-xs text-purple-200 placeholder-purple-400/40 focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleImport}
                className="mt-3 w-full bg-purple-700/70 hover:bg-purple-600/80 py-2 rounded-xl transition font-medium"
              >
                Import
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="mt-2 w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

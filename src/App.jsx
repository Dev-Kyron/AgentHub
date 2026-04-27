import { useState, useEffect } from "react";

/* ---------- ICON HELPER ---------- */

function getFavicon(url) {
  try {
    const domain = new URL(url).origin;
    return `${domain}/favicon.ico`;
  } catch {
    return null;
  }
}

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
    setName("");
    setUrl("");
    setDesc("");
    setEditingIndex(null);
    setShowModal(true);
  };

  const openEdit = (index) => {
    const tool = tools[index];
    setName(tool.name);
    setUrl(tool.url);
    setDesc(tool.desc || "");
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

  const deleteTool = (index) => {
    setTools(tools.filter((_, i) => i !== index));
  };

  /* ---------- DRAG ---------- */

  const handleDragStart = (index) => setDragIndex(index);

  const handleDrop = (index) => {
    if (dragIndex === null) return;

    const updated = [...tools];
    const draggedItem = updated[dragIndex];

    updated.splice(dragIndex, 1);
    updated.splice(index, 0, draggedItem);

    setTools(updated);
    setDragIndex(null);
  };

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 shadow-lg border border-zinc-800 w-full relative">
      <h2 className="text-lg font-semibold mb-4 text-zinc-300">{title}</h2>

      <div className="space-y-3">
        {tools.map((tool, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            className="bg-zinc-800 p-3 rounded-lg flex justify-between items-start gap-3 cursor-move"
          >
            {/* LEFT */}
            <div className="flex gap-3 items-start">
              {/* ICON */}
              <img
                src={getFavicon(tool.url)}
                alt=""
                className="w-5 h-5 mt-1 rounded"
              />

              <div>
                <a
                  href={tool.url}
                  target="_blank"
                  className="text-purple-300 font-medium"
                >
                  {tool.name}
                </a>

                {tool.desc && (
                  <div className="text-xs text-zinc-400 mt-1">
                    {tool.desc}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => openEdit(index)}
                className="text-xs bg-zinc-700 px-2 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => deleteTool(index)}
                className="text-xs bg-red-600 px-2 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={openAdd}
        className="mt-4 w-full bg-purple-700 hover:bg-purple-600 py-2 rounded-lg transition"
      >
        + Add Tool
      </button>

      {showModal && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-2xl">
          <div className="bg-zinc-900 p-6 rounded-xl w-full max-w-xs space-y-4">
            <h3>{editingIndex !== null ? "Edit Tool" : "Add Tool"}</h3>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-full p-2 bg-zinc-800 rounded"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="URL"
              className="w-full p-2 bg-zinc-800 rounded"
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description"
              className="w-full p-2 bg-zinc-800 rounded"
            />

            <div className="flex gap-2">
              <button
                onClick={saveTool}
                className="flex-1 bg-purple-700 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-zinc-700 py-2 rounded"
              >
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
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem("notes") || "";
  });

  const [time, setTime] = useState(new Date());

  const [selectedDay, setSelectedDay] = useState(null);
  const [schedule, setSchedule] = useState(() => {
    return JSON.parse(localStorage.getItem("schedule")) || {};
  });

  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    localStorage.setItem("notes", notes);
  }, [notes]);

  useEffect(() => {
    localStorage.setItem("schedule", JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date().getDay();

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-10 flex gap-8">

      <div className="flex-1">

        {/* LOGO */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
            🎧
          </div>

          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-purple-400 to-purple-700 bg-clip-text text-transparent">
              AgentHub
            </span>
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <Section title="Start of Day" />
          <Section title="Main Day" />
          <Section title="End of Day" />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-80 flex flex-col h-[calc(100vh-80px)]">

        <div className="bg-zinc-900 p-4 rounded-xl flex flex-col flex-1">
          <h2>Notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-zinc-800 p-2 rounded flex-1"
          />
        </div>

        <div className="mt-4 bg-zinc-900 p-4 rounded-xl">
          <div className="text-center mb-2">
            {time.toLocaleTimeString()}
          </div>

          <div className="flex justify-between text-sm mb-3">
            {days.map((day, i) => (
              <div
                key={i}
                onClick={() =>
                  setSelectedDay(selectedDay === day ? null : day)
                }
                className={`flex-1 text-center py-1 rounded cursor-pointer ${
                  selectedDay === day
                    ? "bg-purple-700"
                    : i === today
                    ? "bg-purple-600"
                    : "bg-zinc-800"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {selectedDay && (
            <div className="space-y-2">
              {(schedule[selectedDay] || []).map((item, i) => (
                <div key={i} className="flex justify-between bg-zinc-800 p-2 rounded text-xs">
                  {item}
                  <button onClick={() => deleteScheduleItem(i)}>❌</button>
                </div>
              ))}

              <div className="flex gap-1">
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="flex-1 p-1 bg-zinc-800 rounded text-xs"
                />
                <button onClick={addScheduleItem} className="bg-purple-700 px-2 rounded text-xs">
                  +
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
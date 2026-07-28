import { useEffect, useState } from "react";
import {
  getRaceProfile,
  updateRaceProfile,
  getRaceMorning,
  updateRaceMorningEvent,
  getGear,
  addGear,
  updateGear,
  deleteGear,
} from "../api/client";
import { fmtUTC, calendarDaysUntil } from "../lib/date";

function RaceProfileCard({ profile, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);

  useEffect(() => setForm(profile), [profile]);

  async function save() {
    const updated = await updateRaceProfile(form);
    onSave(updated);
    setEditing(false);
  }

  const splits = form.splitGoals || {};

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">{profile.raceName}</h2>
          <p className="text-sm text-gray-400">{profile.location} · {fmtUTC(profile.raceDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
          <p className="text-xs text-usa-red font-semibold mt-1">{calendarDaysUntil(profile.raceDate)} days to go</p>
        </div>
        <button onClick={() => setEditing((e) => !e)} className="text-xs text-gray-400 hover:text-white no-print">
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-surface-3 rounded-lg py-2">
          <div className="text-swim font-bold text-sm">{profile.swimDistance}</div>
          <div className="text-[10px] text-gray-500 uppercase">Swim</div>
        </div>
        <div className="bg-surface-3 rounded-lg py-2">
          <div className="text-bike font-bold text-sm">{profile.bikeDistance}</div>
          <div className="text-[10px] text-gray-500 uppercase">Bike</div>
        </div>
        <div className="bg-surface-3 rounded-lg py-2">
          <div className="text-run font-bold text-sm">{profile.runDistance}</div>
          <div className="text-[10px] text-gray-500 uppercase">Run</div>
        </div>
      </div>

      {!editing ? (
        <>
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1.5">Goal Splits</div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs">
              {["swim", "t1", "bike", "t2", "run", "total"].map((k) => (
                <div key={k} className="bg-surface-3 rounded-lg py-1.5 text-center">
                  <div className="text-white font-semibold">{splits[k] || "—"}</div>
                  <div className="text-gray-500 uppercase text-[10px]">{k}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Bib Number</div>
            <div className="text-sm text-white">{profile.bibNumber || "TBD"}</div>
          </div>
          <div className="bg-race/10 border border-race/30 rounded-lg p-3">
            <div className="text-xs uppercase tracking-wider text-race font-bold mb-1">Nutrition Strategy</div>
            <p className="text-sm text-gray-200 leading-relaxed">{profile.nutritionPlan}</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Course Notes</div>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{profile.courseNotes}</p>
          </div>
        </>
      ) : (
        <div className="space-y-3 no-print">
          <div>
            <label className="text-xs text-gray-500">Bib Number</label>
            <input
              className="w-full bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-sm text-white mt-1"
              value={form.bibNumber || ""}
              onChange={(e) => setForm({ ...form, bibNumber: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {["swim", "t1", "bike", "t2", "run", "total"].map((k) => (
              <div key={k}>
                <label className="text-xs text-gray-500 uppercase">{k}</label>
                <input
                  className="w-full bg-surface-3 border border-border rounded-lg px-1.5 py-1 text-xs text-white mt-1"
                  value={splits[k] || ""}
                  onChange={(e) => setForm({ ...form, splitGoals: { ...splits, [k]: e.target.value } })}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-gray-500">Nutrition Strategy</label>
            <textarea
              className="w-full bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-sm text-white mt-1"
              rows={3}
              value={form.nutritionPlan || ""}
              onChange={(e) => setForm({ ...form, nutritionPlan: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Course Notes</label>
            <textarea
              className="w-full bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-sm text-white mt-1"
              rows={4}
              value={form.courseNotes || ""}
              onChange={(e) => setForm({ ...form, courseNotes: e.target.value })}
            />
          </div>
          <button onClick={save} className="bg-usa-blue text-white font-semibold text-sm rounded-lg px-4 py-1.5">
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function MorningTimeline({ events, onToggle }) {
  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <h2 className="text-sm font-semibold text-white mb-3">Race Morning Timeline</h2>
      <div className="space-y-1">
        {events.map((e) => (
          <label key={e.id} className={`flex items-start gap-3 py-1.5 px-1 rounded-lg cursor-pointer ${e.done ? "opacity-50" : ""}`}>
            <input type="checkbox" checked={e.done} onChange={() => onToggle(e)} className="mt-1" />
            <div className="min-w-16 text-xs font-bold text-usa-red">{e.time}</div>
            <div>
              <div className={`text-sm text-white ${e.done ? "line-through" : ""}`}>{e.label}</div>
              {e.detail && <div className="text-xs text-gray-500">{e.detail}</div>}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function GearChecklist({ items, onToggle, onAdd, onDelete }) {
  const [newItem, setNewItem] = useState({ category: "Bike", name: "" });
  const categories = [...new Set(items.map((i) => i.category))];

  async function submit(e) {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    await onAdd(newItem);
    setNewItem({ ...newItem, name: "" });
  }

  const packedCount = items.filter((i) => i.packed).length;

  return (
    <div className="bg-surface-2 border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white">Gear Checklist</h2>
        <span className="text-xs text-gray-500">{packedCount}/{items.length} packed</span>
      </div>
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat}>
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">{cat}</div>
            <div className="space-y-1">
              {items.filter((i) => i.category === cat).map((item) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <label className="flex items-center gap-2 flex-1 cursor-pointer py-0.5">
                    <input type="checkbox" checked={item.packed} onChange={() => onToggle(item)} />
                    <span className={`text-sm ${item.packed ? "text-gray-500 line-through" : "text-gray-200"}`}>{item.name}</span>
                  </label>
                  <button onClick={() => onDelete(item.id)} className="text-gray-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 no-print">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="flex gap-2 mt-4 no-print">
        <select
          value={newItem.category}
          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
          className="bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-xs text-white"
        >
          {["Swim", "Bike", "Run", "Nutrition", "Morning-Of", "Bags/Docs"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          placeholder="Add item..."
          className="flex-1 bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-xs text-white"
        />
        <button className="bg-usa-blue text-white font-semibold text-xs rounded-lg px-3 py-1.5">Add</button>
      </form>
    </div>
  );
}

export default function RaceDay() {
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [gear, setGear] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRaceProfile(), getRaceMorning(), getGear()])
      .then(([p, e, g]) => {
        setProfile(p);
        setEvents(e);
        setGear(g);
      })
      .finally(() => setLoading(false));
  }, []);

  async function toggleEvent(event) {
    const updated = await updateRaceMorningEvent(event.id, { done: !event.done });
    setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }

  async function toggleGear(item) {
    const updated = await updateGear(item.id, { packed: !item.packed });
    setGear((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function handleAddGear(data) {
    const created = await addGear(data);
    setGear((prev) => [...prev, created]);
  }

  async function handleDeleteGear(id) {
    await deleteGear(id);
    setGear((prev) => prev.filter((i) => i.id !== id));
  }

  if (loading) return <div className="text-gray-500 text-sm py-12 text-center">Loading race day info...</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-white">Race Day</h1>
      {profile && <RaceProfileCard profile={profile} onSave={setProfile} />}
      <div className="grid gap-5 md:grid-cols-2">
        <MorningTimeline events={events} onToggle={toggleEvent} />
        <GearChecklist items={gear} onToggle={toggleGear} onAdd={handleAddGear} onDelete={handleDeleteGear} />
      </div>
    </div>
  );
}

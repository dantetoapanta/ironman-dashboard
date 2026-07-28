import { useEffect, useState } from "react";
import { getScheduleProfiles, getActiveScheduleProfile, updateScheduleProfile } from "../api/client";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function ProfileEditor({ profile, isActive, onSave }) {
  const [form, setForm] = useState(profile);
  const [dirty, setDirty] = useState(false);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  }

  function updateBlock(idx, field, value) {
    const blocks = [...form.blocks];
    blocks[idx] = { ...blocks[idx], [field]: value };
    updateField("blocks", blocks);
  }

  function addBlock() {
    updateField("blocks", [...form.blocks, { day: "TUE", start: "08:00", end: "09:00", label: "Class block" }]);
  }

  function removeBlock(idx) {
    updateField("blocks", form.blocks.filter((_, i) => i !== idx));
  }

  async function save() {
    const updated = await updateScheduleProfile(profile.id, {
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      blocks: form.blocks,
    });
    onSave(updated);
    setDirty(false);
  }

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${isActive ? "border-usa-red bg-usa-red/5" : "border-border bg-surface-2"}`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-white">{form.name}</h2>
        {isActive && <span className="text-[10px] font-bold uppercase tracking-wider bg-usa-red text-white rounded-full px-2 py-0.5">Active Now</span>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500">Applies from</label>
          <input
            type="date"
            value={form.startDate ? form.startDate.slice(0, 10) : ""}
            onChange={(e) => updateField("startDate", e.target.value)}
            className="w-full bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-xs text-white mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Applies until</label>
          <input
            type="date"
            value={form.endDate ? form.endDate.slice(0, 10) : ""}
            onChange={(e) => updateField("endDate", e.target.value)}
            className="w-full bg-surface-3 border border-border rounded-lg px-2 py-1.5 text-xs text-white mt-1"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1.5 block">
          {form.blocks.length === 0 ? "No fixed class blocks — fully open schedule." : "Fixed class blocks (training must fit around these)"}
        </label>
        <div className="space-y-1.5">
          {form.blocks.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <select
                value={b.day}
                onChange={(e) => updateBlock(i, "day", e.target.value)}
                className="bg-surface-3 border border-border rounded-lg px-1.5 py-1 text-xs text-white"
              >
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <input
                type="time"
                value={b.start}
                onChange={(e) => updateBlock(i, "start", e.target.value)}
                className="bg-surface-3 border border-border rounded-lg px-1.5 py-1 text-xs text-white"
              />
              <span className="text-gray-600 text-xs">–</span>
              <input
                type="time"
                value={b.end}
                onChange={(e) => updateBlock(i, "end", e.target.value)}
                className="bg-surface-3 border border-border rounded-lg px-1.5 py-1 text-xs text-white"
              />
              <input
                type="text"
                value={b.label}
                onChange={(e) => updateBlock(i, "label", e.target.value)}
                className="flex-1 bg-surface-3 border border-border rounded-lg px-1.5 py-1 text-xs text-white min-w-0"
              />
              <button onClick={() => removeBlock(i)} className="text-gray-600 hover:text-red-400 text-xs shrink-0">✕</button>
            </div>
          ))}
        </div>
        <button onClick={addBlock} className="mt-2 text-xs text-gray-400 hover:text-white">+ Add class block</button>
      </div>

      {dirty && (
        <button onClick={save} className="bg-usa-blue text-white font-semibold text-sm rounded-lg px-4 py-1.5">
          Save Changes
        </button>
      )}
    </div>
  );
}

export default function Settings() {
  const [profiles, setProfiles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  function refresh() {
    return Promise.all([getScheduleProfiles(), getActiveScheduleProfile()]).then(([all, active]) => {
      setProfiles(all);
      setActiveId(active.id);
    });
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  function handleSave(updated) {
    setProfiles((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Schedule Profiles</h1>
        <p className="text-sm text-gray-400 mt-1">
          The app auto-detects School Year vs. Summer/Break based on today's date and each profile's date range. Update these each semester.
        </p>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm py-12 text-center">Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((p) => (
            <ProfileEditor key={p.id} profile={p} isActive={p.id === activeId} onSave={handleSave} />
          ))}
        </div>
      )}
    </div>
  );
}

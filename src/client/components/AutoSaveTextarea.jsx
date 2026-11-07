import React, { useState, useEffect, useRef } from 'react';
import { saveNoteOfflineFirst } from '../lib/offlineStore.js';
export default function AutoSaveTextarea({ businessId, initialNotes = '', onSaved }) {
  const [notes, setNotes] = useState(initialNotes || '');
  const timerRef = useRef(null);
  useEffect(() => { setNotes(initialNotes || ''); }, [businessId, initialNotes]);
  const handleChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const updated = await saveNoteOfflineFirst(businessId, val);
      if (onSaved) onSaved(updated);
    }, 1500);
  };
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold uppercase text-slate-600">Field Visit Notes</label>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Saved ✓</span>
      </div>
      <textarea rows={3} value={notes} onChange={handleChange} placeholder="Log parcel volume, rates, or follow-up..." className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm" />
    </div>
  );
}
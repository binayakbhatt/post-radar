import React from 'react';
import AutoSaveTextarea from './AutoSaveTextarea.jsx';
export default function PitchView({ business, orgConfigs = [], onBusinessUpdated }) {
  const matched = orgConfigs.find((c) => c.business_type.toLowerCase() === (business.business_type || '').toLowerCase()) || {
    recommended_product: 'Speed Post & Business Parcel (BNPL)',
    pitch_script: 'Namaskar! We offer India Post corporate BNPL parcel & Speed Post accounts with doorstep pickup.'
  };
  const lastVisited = business.last_visited_at ? new Date(business.last_visited_at * 1000).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never visited';
  return (
    <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
      <div className="rounded-xl bg-red-50 border border-red-200 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-[#B91C1C]">Recommended Product</span>
          <span className="text-[11px] text-slate-500">Last: {lastVisited}</span>
        </div>
        <p className="mt-1 text-sm font-bold text-slate-900">{matched.recommended_product}</p>
      </div>
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
        <span className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Starting Conversation Script</span>
        <p className="text-xs text-slate-800 italic">“{matched.pitch_script}”</p>
      </div>
      <AutoSaveTextarea businessId={business.id} initialNotes={business.latest_notes} onSaved={onBusinessUpdated} />
    </div>
  );
}
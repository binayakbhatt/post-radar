import React, { useState } from 'react';
import DigipinButton from './DigipinButton.jsx';
import PitchView from './PitchView.jsx';
export default function BusinessCard({ business, orgConfigs, onBusinessUpdated }) {
  const [expanded, setExpanded] = useState(false);
  const dist = business.distance_meters < 1000 ? business.distance_meters + 'm' : (business.distance_meters / 1000).toFixed(1) + 'km';
  return (
    <article className="rounded-2xl bg-white border border-slate-200 p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">{business.name}</h2>
        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-red-100 text-[#B91C1C]">{dist}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <span className="px-2.5 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-800">{business.business_type}</span>
        {business.phone && <a href={'tel:' + business.phone} className="font-medium text-blue-700 underline">📞 {business.phone}</a>}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <DigipinButton lat={business.lat} lng={business.lng} digipin={business.digipin} />
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex-1 min-h-[46px] px-3 py-2.5 rounded-xl font-semibold text-xs bg-[#B91C1C] text-white">
          {expanded ? 'Hide Pitch ▲' : 'View Pitch & Notes ▼'}
        </button>
      </div>
      {expanded && <PitchView business={business} orgConfigs={orgConfigs} onBusinessUpdated={onBusinessUpdated} />}
    </article>
  );
}
// src/components/RadarView.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api.js';
import BusinessCard from './BusinessCard.jsx';

export default function RadarView({ coords, syncFlag, onOpenAddModal, user }) {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  const lat = coords?.lat || 27.47528;
  const lng = coords?.lng || 94.90274;

  const { data = { businesses: [] }, isLoading } = useQuery({
    queryKey: ['businesses', lat, lng, syncFlag],
    queryFn: () => apiFetch(`/api/businesses?lat=${lat}&lng=${lng}&sync=1`),
  });

  const { data: configsData = { configs: [] } } = useQuery({
    queryKey: ['configs'],
    queryFn: () => apiFetch('/api/admin/configs'),
  });
  const businessesList = data?.businesses || [];
  // Dynamically include all categories present in nearby leads + core categories
  const categories = React.useMemo(() => {
    const core = ['ALL', 'School', 'Hospital', 'Bank', 'Police Station', 'Retail', 'Factory'];
    const dynamicSet = new Set(core);
    businessesList.forEach((b) => {
      if (b.business_type) dynamicSet.add(b.business_type);
    });
    return Array.from(dynamicSet);
  }, [businessesList]);
 
  const filtered =
    selectedTypeFilter === 'ALL'
      ? businessesList
      : businessesList.filter(
          (b) => b.business_type.toLowerCase() === selectedTypeFilter.toLowerCase()
        );

  return (
    <div className="space-y-3">
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
        <div>
          <span className="block text-xs font-bold text-slate-800">
            Nearby Institutions ({filtered.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Sorted nearest to your live GPS coordinates
          </span>
        </div>
        <button
          onClick={onOpenAddModal}
          className="min-h-[38px] px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm"
        >
          ＋ Add Location
        </button>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedTypeFilter(cat)}
            className={`min-h-[38px] px-3 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedTypeFilter === cat
                ? 'bg-[#B91C1C] text-white shadow-xs'
                : 'bg-white border text-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-center text-sm text-slate-500 py-6">
          Scanning nearby institutions via GPS...
        </p>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="bg-white p-6 rounded-2xl text-center text-xs text-slate-500 border">
          No institutions found in this category nearby. Tap "↻ Refresh" or "＋ Add Location".
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((biz) => (
          <BusinessCard
            key={biz.id}
            business={biz}
            userCoords={{ lat, lng }}
            orgConfigs={configsData?.configs || []}
            user={user}
          />
        ))}
      </div>
    </div>
  );
}

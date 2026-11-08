// src/components/BusinessCard.jsx
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api.js';
import { formatDistanceAndDirection } from '../shared/geo.js';
import InlineLeafletMap from './InlineLeafletMap.jsx';

export default function BusinessCard({ business, userCoords, orgConfigs, user }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showPitch, setShowPitch] = useState(false);
  const [showInlineMap, setShowInlineMap] = useState(false);

  const [isVisited, setIsVisited] = useState(business.is_visited === 1);
  const [visitRemark, setVisitRemark] = useState(business.visit_remark || '');
  const [nextFollowUp, setNextFollowUp] = useState(business.next_follow_up_date || '');
  const [addToDiary, setAddToDiary] = useState(business.added_to_diary === 1);
  const [diaryDetails, setDiaryDetails] = useState(business.diary_details || '');

  const matchedConfig = orgConfigs.find(
    (c) => c.business_type.toLowerCase() === business.business_type.toLowerCase()
  ) || {
    recommended_product: 'India Post Corporate Speed Post & Business Parcel',
    pitch_script:
      'Namaskar! We are visiting from India Post to offer preferential corporate business rates and dedicated pickup.',
  };

  const distDir = formatDistanceAndDirection(
    userCoords.lat,
    userCoords.lng,
    business.lat,
    business.lng
  );

  const saveVisitMutation = useMutation({
    mutationFn: (payload) =>
      apiFetch('/api/visits', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['diary'] });
    },
  });

  const handleSave = () => {
    saveVisitMutation.mutate({
      business_id: business.id,
      user_id: user.id,
      is_visited: isVisited,
      visit_remark: visitRemark,
      next_follow_up_date: nextFollowUp,
      added_to_diary: addToDiary,
      diary_details: diaryDetails,
    });
    alert('Visit & Diary details saved successfully!');
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              {business.business_type}
            </span>
            {business.address && (
              <span className="text-[10px] font-medium text-slate-500 truncate max-w-[180px]">
                {business.address}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-1">{business.name}</h2>
        </div>
        <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-[#B91C1C]">
          📍 {distDir}
        </span>
      </div>

      {business.phone && <p className="text-xs text-blue-700 font-medium">📞 {business.phone}</p>}

      {/* Recommended Products Section */}
      <div className="rounded-xl bg-red-50 border border-red-200 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B91C1C]">
            Recommended Product & Service
          </span>
          <button
            onClick={() => setShowPitch(!showPitch)}
            className="min-h-[32px] px-2.5 rounded-lg bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-xs shadow-xs"
          >
            {showPitch ? 'Hide Pitch' : 'Show Pitch'}
          </button>
        </div>
        <p className="text-xs font-bold text-slate-900">{matchedConfig.recommended_product}</p>

        {showPitch && (
          <div className="pt-2 border-t border-red-200 text-xs text-slate-800 italic">
            “{matchedConfig.pitch_script}”
          </div>
        )}
      </div>

      {/* Inline Interactive Map Toggle Button + Expand Details */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowInlineMap(!showInlineMap)}
          className="flex-1 min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-500 text-red-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
        >
          🗺️ {showInlineMap ? 'Hide Map ▲' : 'Show Map ▼'}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex-1 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
        >
          {expanded ? 'Hide Details ▲' : 'Log Visit / Diary ▼'}
        </button>
      </div>

      {/* Embedded Interactive Leaflet Map */}
      {showInlineMap && (
        <div className="space-y-1.5 pt-1">
          <InlineLeafletMap
            lat={business.lat}
            lng={business.lng}
            userLat={userCoords.lat}
            userLng={userCoords.lng}
            title={business.name}
            heightClass="h-44"
            showRouteLine={true}
          />
          <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
            <span>
              🟢 Your GPS ({userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)})
            </span>
            <span>
              🔴 {business.name} ({distDir})
            </span>
          </div>
        </div>
      )}

      {/* Expanded Details & Visit / Diary Logging */}
      {expanded && (
        <div className="pt-3 border-t border-slate-200 space-y-3 bg-slate-50 p-3 rounded-xl">
          {business.is_visited === 1 && (
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold">✓ Previously Visited</p>
              <p>
                <b>Remark:</b> {business.visit_remark || 'None'}
              </p>
              {business.next_follow_up_date && (
                <p>
                  <b>Follow-up:</b> {business.next_follow_up_date}
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isVisited}
                onChange={(e) => setIsVisited(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              Mark as Visited Today
            </label>
            <input
              type="date"
              value={nextFollowUp}
              onChange={(e) => setNextFollowUp(e.target.value)}
              className="text-xs border rounded-lg px-2 py-1 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Visit Remark</label>
            <textarea
              rows={2}
              value={visitRemark}
              onChange={(e) => setVisitRemark(e.target.value)}
              placeholder="Record customer response, product interest..."
              className="w-full p-2 text-xs rounded-lg border bg-white"
            />
          </div>

          <div className="border-t pt-2 space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addToDiary}
                onChange={(e) => setAddToDiary(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded"
              />
              Add to Personal Field Diary
            </label>
            {addToDiary && (
              <textarea
                rows={2}
                value={diaryDetails}
                onChange={(e) => setDiaryDetails(e.target.value)}
                placeholder="Detailed notes for diary export..."
                className="w-full p-2 text-xs rounded-lg border bg-white"
              />
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saveVisitMutation.isPending}
            className="w-full min-h-[42px] rounded-xl bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-xs shadow-sm"
          >
            {saveVisitMutation.isPending ? 'Saving...' : 'Save Visit & Diary Details ✓'}
          </button>
        </div>
      )}
    </article>
  );
}

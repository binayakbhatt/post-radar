// src/components/DiaryView.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api.js';
import { exportDiaryToExcel } from '../lib/exportExcel.js';

export default function DiaryView({ user }) {
  const [mode, setMode] = useState('personal');
  const { data = { diary: [] }, isLoading } = useQuery({
    queryKey: ['diary', mode],
    queryFn: () => apiFetch(mode === 'divisional' ? '/api/diary/divisional' : '/api/diary'),
  });

  const diaryEntries = data?.diary || [];
  const canViewDivisional = user.role === 'super_admin' || user.role === 'admin';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">Field Diary & Visit Logs</h2>
        <div className="flex items-center space-x-2">
          {canViewDivisional && (
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => setMode('personal')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  mode === 'personal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                My Diary
              </button>
              <button
                onClick={() => setMode('divisional')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  mode === 'divisional' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Divisional
              </button>
            </div>
          )}
          <button
            onClick={() => exportDiaryToExcel(diaryEntries, mode, user.full_name)}
            className="min-h-[36px] px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs flex items-center gap-1"
          >
            📊 Export Excel (.xls)
          </button>
        </div>
      </div>

      {isLoading && <p className="text-xs text-slate-500">Loading diary entries...</p>}
      {!isLoading && diaryEntries.length === 0 && (
        <div className="bg-white p-6 rounded-2xl text-center text-xs text-slate-500 border">
          No entries added to diary yet. Expand business cards and check "Add to Personal Field Diary".
        </div>
      )}
      {diaryEntries.map((entry) => (
        <div
          key={entry.id}
          className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5 shadow-xs"
        >
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-bold text-[#B91C1C]">{entry.business_name}</span>
              {mode === 'divisional' && (
                <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                  By: {entry.executive_name}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(entry.visited_at * 1000).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
            {entry.diary_details || entry.visit_remark || 'No remark'}
          </p>
          {entry.next_follow_up_date && (
            <p className="text-[11px] font-semibold text-emerald-700">
              📅 Follow-up: {entry.next_follow_up_date}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

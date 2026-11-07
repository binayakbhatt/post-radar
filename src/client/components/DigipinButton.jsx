import React, { useState } from 'react';
import { generateDigipin } from '../../shared/geo.js';
export default function DigipinButton({ lat, lng, digipin }) {
  const [copied, setCopied] = useState(false);
  const resolvedPin = digipin || generateDigipin(lat, lng);
  const handleAction = async (e) => {
    e.stopPropagation();
    try { await navigator.clipboard.writeText(resolvedPin); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    window.open('https://digipin.com/?pin=' + encodeURIComponent(resolvedPin), '_blank', 'noopener,noreferrer');
  };
  return (
    <button type="button" onClick={handleAction} className="flex-1 min-h-[46px] px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm">
      <span>📍</span>
      <div className="flex flex-col items-start leading-tight">
        <span>{copied ? 'Pin Copied ✓' : 'Digipin Map'}</span>
        <span className="font-mono text-[10px] text-amber-800">{resolvedPin}</span>
      </div>
    </button>
  );
}
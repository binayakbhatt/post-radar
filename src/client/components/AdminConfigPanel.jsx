import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiClient.js';
export default function AdminConfigPanel({ onClose }) {
  const qc = useQueryClient();
  const [businessType, setBusinessType] = useState('');
  const [recommendedProduct, setRecommendedProduct] = useState('');
  const [pitchScript, setPitchScript] = useState('');
  const { data } = useQuery({ queryKey: ['org_configs'], queryFn: async () => (await apiFetch('/api/configs')).json() });
  const mut = useMutation({
    mutationFn: async (p) => (await apiFetch('/api/configs', { method: 'POST', body: JSON.stringify(p) })).json(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['org_configs'] }); setBusinessType(''); setRecommendedProduct(''); setPitchScript(''); }
  });
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-end justify-center">
      <div className="w-full max-w-[414px] bg-white rounded-t-3xl p-4 max-h-[85vh] overflow-y-auto space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-base">Admin Pitch Config</h2>
          <button onClick={onClose} className="min-w-[44px] min-h-[44px] font-bold">✕</button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate({ business_type: businessType, recommended_product: recommendedProduct, pitch_script: pitchScript }); }} className="space-y-2">
          <input required placeholder="Business Type (e.g., Retail)" value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="w-full min-h-[44px] px-3 rounded-xl border text-sm" />
          <input required placeholder="Recommended Product" value={recommendedProduct} onChange={(e) => setRecommendedProduct(e.target.value)} className="w-full min-h-[44px] px-3 rounded-xl border text-sm" />
          <textarea required rows={3} placeholder="Pitch Script" value={pitchScript} onChange={(e) => setPitchScript(e.target.value)} className="w-full p-3 rounded-xl border text-sm" />
          <button type="submit" className="w-full min-h-[46px] rounded-xl bg-[#B91C1C] text-white font-bold text-xs">Save Configuration</button>
        </form>
      </div>
    </div>
  );
}
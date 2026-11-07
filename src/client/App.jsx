import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BusinessCard from './components/BusinessCard.jsx';
import AdminConfigPanel from './components/AdminConfigPanel.jsx';
import { apiFetch } from './lib/apiClient.js';
import { generateDigipin } from '../shared/geo.js';

export default function App() {
  const qc = useQueryClient();
  const [email, setEmail] = useState('admin@indiapost.gov.in');
  const [otp, setOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(false);
  const [coords, setCoords] = useState({ lat: 27.4728, lng: 94.9120 });
  const [showAdmin, setShowAdmin] = useState(false);

  const { data: auth, refetch: refetchAuth } = useQuery({
    queryKey: ['auth_me'],
    retry: false,
    queryFn: async () => {
      const r = await apiFetch('/api/auth/me');
      if (!r.ok) throw new Error('Unauth');
      return r.json();
    }
  });

  useEffect(() => {
    if (auth?.user && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((p) => setCoords({ lat: Number(p.coords.latitude.toFixed(6)), lng: Number(p.coords.longitude.toFixed(6)) }), () => {});
    }
  }, [auth?.user]);

  const { data: cfgData } = useQuery({
    queryKey: ['org_configs'],
    enabled: !!auth?.user,
    queryFn: async () => (await apiFetch('/api/configs')).json()
  });

  const { data: bizData } = useQuery({
    queryKey: ['nearby', coords.lat, coords.lng],
    enabled: !!auth?.user,
    queryFn: async () => (await apiFetch('/api/businesses/nearby?lat=' + coords.lat + '&lng=' + coords.lng)).json()
  });

  if (!auth?.user) {
    return (
      <main className="min-h-screen max-w-[414px] mx-auto bg-[#B91C1C] text-white p-6 flex flex-col justify-center">
        <div className="bg-white text-slate-900 rounded-3xl p-5 shadow-xl space-y-3">
          <h1 className="text-xl font-black text-[#B91C1C]">Post Radar Sign-In</h1>
          {!otpSent ? (
            <form onSubmit={async (e) => { e.preventDefault(); await apiFetch('/api/auth/request-otp', { method: 'POST', body: JSON.stringify({ email }) }); setOtpSent(true); }} className="space-y-3">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full min-h-[46px] px-3 rounded-xl border text-sm" />
              <button type="submit" className="w-full min-h-[46px] rounded-xl bg-[#B91C1C] text-white font-bold text-sm">Send Login OTP</button>
            </form>
          ) : (
            <form onSubmit={async (e) => { e.preventDefault(); await apiFetch('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }); refetchAuth(); }} className="space-y-3">
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full min-h-[46px] px-3 rounded-xl border text-lg font-mono" />
              <button type="submit" className="w-full min-h-[46px] rounded-xl bg-[#B91C1C] text-white font-bold text-sm">Verify OTP (123456)</button>
            </form>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen max-w-[414px] mx-auto bg-slate-100 pb-16">
      <header className="sticky top-0 z-20 bg-[#B91C1C] text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-black">Post Radar</h1>
            <p className="text-xs text-red-100">DIGIPIN: {generateDigipin(coords.lat, coords.lng)}</p>
          </div>
          <button onClick={() => setShowAdmin(true)} className="min-h-[44px] px-3 rounded-xl bg-amber-400 text-red-950 font-bold text-xs">⚙️ Config</button>
        </div>
      </header>
      <main className="p-3.5 space-y-3">
        {(bizData?.businesses || []).map((b) => (
          <BusinessCard key={b.id} business={b} orgConfigs={cfgData?.configs || []} onBusinessUpdated={() => qc.invalidateQueries({ queryKey: ['nearby'] })} />
        ))}
      </main>
      {showAdmin && <AdminConfigPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
// src/App.jsx
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './lib/api.js';
import InlineLeafletMap from './components/InlineLeafletMap.jsx';
import RadarView from './components/RadarView.jsx';
import DiaryView from './components/DiaryView.jsx';
import AdminView from './components/AdminView.jsx';

export default function App() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // GPS Coordinates & Accuracy State
  const [coords, setCoords] = useState({ lat: 27.47528, lng: 94.90274 });
  const [accuracy, setAccuracy] = useState(null);
  const [showHeaderMap, setShowHeaderMap] = useState(true);
  const [syncFlag, setSyncFlag] = useState(1);
  const [activeTab, setActiveTab] = useState('radar');

  // Login Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // New Location Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('School');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const captureLocation = () => {
    if (!('geolocation' in navigator)) {
      setCoords({ lat: 27.47528, lng: 94.90274 });
      setAccuracy(50);
      setSyncFlag((prev) => prev + 1);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const acc = Math.round(pos.coords.accuracy || 25);
        setCoords({ lat, lng });
        setAccuracy(acc);
        setSyncFlag((prev) => prev + 1);
      },
      () => {
        setCoords({ lat: 27.47528, lng: 94.90274 });
        setAccuracy(120);
        setSyncFlag((prev) => prev + 1);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    const token = localStorage.getItem('post_radar_token');
    if (!token) {
      setAuthLoading(false);
      return;
    }
    apiFetch('/api/auth/me')
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          captureLocation();
        }
      })
      .catch(() => {
        localStorage.removeItem('post_radar_token');
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (data.token) {
        localStorage.setItem('post_radar_token', data.token);
      }
      setUser(data.user);
      captureLocation();
    } catch (err) {
      alert(err.message || 'Login failed');
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {}
    localStorage.removeItem('post_radar_token');
    setUser(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen max-w-[414px] mx-auto bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
        <img src="post-radar-mark.svg" className="w-10 h-10 animate-pulse mr-3" alt="Logo" />
        Loading Post Radar...
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen max-w-[414px] mx-auto bg-gradient-to-b from-[#B91C1C] to-red-950 text-white p-6 flex flex-col justify-center">
        <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="text-center flex flex-col items-center">
            <img src="post-radar-mark.svg" className="w-16 h-16 mb-2" alt="Post Radar Logo" />
            <span className="px-3 py-1 rounded-full bg-amber-400 text-red-950 font-black text-[10px] uppercase tracking-wider">
              Department of Posts • India Post
            </span>
            <h1 className="text-2xl font-black mt-2 text-[#B91C1C]">Post Radar</h1>
            <p className="text-xs text-slate-500">Field Marketing & Institutional Intelligence</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-sm shadow-md transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </main>
    );
  }

  const canAccessAdmin = user.role === 'super_admin' || user.role === 'admin';
  const isHighAcc = accuracy !== null && accuracy <= 50;

  return (
    <div className="min-h-screen max-w-[414px] mx-auto bg-slate-100 flex flex-col pb-20 shadow-xl">
      <header className="bg-[#B91C1C] text-white px-4 pt-4 pb-3 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <img src="post-radar-mark.svg" className="w-9 h-9 bg-white/10 rounded-full p-1" alt="Logo" />
            <div>
              <h1 className="text-base font-black tracking-tight leading-tight">Post Radar</h1>
              <p className="text-[11px] text-red-100">
                {user.full_name} ({user.role.replace('_', ' ')})
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="min-h-[36px] px-3 rounded-lg bg-red-800 hover:bg-red-900 text-white font-bold text-xs shadow-xs"
          >
            Logout
          </button>
        </div>

        {/* Live GPS Location & Embedded Leaflet Map Card */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-cyan-400 text-sm">⊕</span>
              <span className="font-bold text-white tracking-wide">
                GPS Location / জিপিএছ অৱস্থান[cite: 5]
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowHeaderMap(!showHeaderMap)}
                className="text-[11px] text-slate-300 hover:text-white underline"
              >
                {showHeaderMap ? 'Hide Map' : 'Show Map'}
              </button>
              <button
                type="button"
                onClick={captureLocation}
                className="text-cyan-400 hover:text-cyan-300 font-bold text-[11px] flex items-center gap-1"
              >
                ↻ Refresh / পুনৰ কৰক[cite: 5]
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-slate-300">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </span>
            <span className={`font-semibold ${isHighAcc ? 'text-emerald-400' : 'text-rose-400'}`}>
              ● Accuracy / নিৰ্ভুলতা: {isHighAcc ? 'High' : 'Low'} (~{accuracy || 95}m)[cite: 5]
            </span>
          </div>

          {showHeaderMap && (
            <InlineLeafletMap
              lat={coords.lat}
              lng={coords.lng}
              title="Your Current GPS Position"
              heightClass="h-28"
            />
          )}
        </div>
      </header>

      <nav
        className={`grid ${
          canAccessAdmin ? 'grid-cols-3' : 'grid-cols-2'
        } bg-white border-b border-slate-200 p-1 text-center text-xs font-bold text-slate-700`}
      >
        <button
          onClick={() => setActiveTab('radar')}
          className={`py-2.5 rounded-lg transition-all ${
            activeTab === 'radar' ? 'bg-[#B91C1C] text-white shadow-sm' : 'hover:bg-slate-50'
          }`}
        >
          Radar Leads
        </button>
        <button
          onClick={() => setActiveTab('diary')}
          className={`py-2.5 rounded-lg transition-all ${
            activeTab === 'diary' ? 'bg-[#B91C1C] text-white shadow-sm' : 'hover:bg-slate-50'
          }`}
        >
          My Diary
        </button>
        {canAccessAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-2.5 rounded-lg transition-all ${
              activeTab === 'admin' ? 'bg-[#B91C1C] text-white shadow-sm' : 'hover:bg-slate-50'
            }`}
          >
            Admin Panel
          </button>
        )}
      </nav>

      <main className="p-3.5 flex-1">
        {activeTab === 'radar' && (
          <RadarView
            coords={coords}
            syncFlag={syncFlag}
            onOpenAddModal={() => setShowAddModal(true)}
            user={user}
          />
        )}
        {activeTab === 'diary' && <DiaryView user={user} />}
        {activeTab === 'admin' && canAccessAdmin && <AdminView user={user} />}
      </main>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-end justify-center">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await apiFetch('/api/businesses', {
                  method: 'POST',
                  body: JSON.stringify({
                    name: newName,
                    business_type: newType,
                    phone: newPhone,
                    address: newAddress,
                    lat: coords?.lat || 27.47528,
                    lng: coords?.lng || 94.90274,
                  }),
                });
                setShowAddModal(false);
                setNewName('');
                setNewPhone('');
                setNewAddress('');
                queryClient.invalidateQueries({ queryKey: ['businesses'] });
              } catch (err) {
                alert(err.message || 'Failed to save location');
              }
            }}
            className="w-full max-w-[414px] bg-white rounded-t-3xl p-5 space-y-3 animate-in slide-in-from-bottom"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900">
                Add New Institution at Current GPS
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="font-bold text-slate-500"
              >
                ✕
              </button>
            </div>
            <input
              required
              placeholder="Institution Name (e.g., Dhemaji Public School)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-sm"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-sm bg-white"
            >
              <option value="School">School</option>
              <option value="Hospital">Hospital / Nursing</option>
              <option value="Bank">Bank</option>
              <option value="Police Station">Police Station</option>
              <option value="Fire Brigade">Fire Brigade</option>
              <option value="Retail">Retail Business</option>
              <option value="Factory">Factory / Industrial</option>
            </select>
            <input
              placeholder="Phone Number"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-sm"
            />
            <input
              placeholder="Address / Area Description"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl border border-slate-300 text-sm"
            />
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-sm shadow-sm"
            >
              Save Location to Area Radar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

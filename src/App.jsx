// src/App.jsx
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './lib/api.js';
import InlineLeafletMap from './components/InlineLeafletMap.jsx';
import RadarView from './components/RadarView.jsx';
import DiaryView from './components/DiaryView.jsx';
import AdminView from './components/AdminView.jsx';
import { EXHAUSTIVE_CATEGORIES } from './lib/categories.js';

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
  const [customNewType, setCustomNewType] = useState(''); // <-- FIXED: Moved inside App component
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
      <div className="min-h-screen w-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
        <img src="post-radar-mark.svg" className="w-10 h-10 animate-pulse mr-3" alt="Logo" />
        Loading Post Radar...
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full bg-gradient-to-br from-[#B91C1C] via-red-900 to-slate-950 text-white p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-8 shadow-2xl space-y-5 border border-white/20">
          <div className="text-center flex flex-col items-center">
            <img src="post-radar-mark.svg" className="w-16 h-16 mb-2.5" alt="Post Radar Logo" />
            <span className="px-3.5 py-1 rounded-full bg-amber-400 text-red-950 font-black text-[10px] uppercase tracking-wider shadow-xs">
              Department of Posts • India Post
            </span>
            <h1 className="text-2xl font-black mt-2.5 text-[#B91C1C]">Post Radar</h1>
            <p className="text-xs text-slate-500">Field Marketing & Institutional Intelligence</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]"
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
                className="w-full min-h-[46px] px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
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
    <div className="min-h-screen w-full bg-slate-100 flex flex-col pb-16">
      {/* Full-Width Top Header */}
      <header className="bg-[#B91C1C] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-3 space-y-3">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center space-x-3">
              <img src="post-radar-mark.svg" className="w-10 h-10 bg-white/10 rounded-full p-1" alt="Logo" />
              <div>
                <h1 className="text-lg font-black tracking-tight leading-tight">Post Radar</h1>
                <p className="text-xs text-red-100">
                  {user.full_name} ({user.role.replace('_', ' ')})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Desktop Navigation Pills */}
              <nav className="hidden md:flex bg-red-900/60 p-1 rounded-xl border border-red-400/20 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('radar')}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'radar' ? 'bg-amber-400 text-red-950 shadow-xs' : 'text-red-100 hover:text-white'
                  }`}
                >
                  Radar Leads
                </button>
                <button
                  onClick={() => setActiveTab('diary')}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'diary' ? 'bg-amber-400 text-red-950 shadow-xs' : 'text-red-100 hover:text-white'
                  }`}
                >
                  My Diary
                </button>
                {canAccessAdmin && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'admin' ? 'bg-amber-400 text-red-950 shadow-xs' : 'text-red-100 hover:text-white'
                    }`}
                  >
                    Admin Panel
                  </button>
                )}
              </nav>

              <button
                onClick={handleLogout}
                className="min-h-[38px] px-3.5 rounded-xl bg-red-900 hover:bg-red-950 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Live GPS Location & Embedded Leaflet Map Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs space-y-2.5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-cyan-400 text-sm">⊕</span>
                <span className="font-bold text-white tracking-wide">
                  GPS Location
                </span>
                <span className="hidden sm:inline-block font-mono text-slate-400 pl-1">
                  ({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowHeaderMap(!showHeaderMap)}
                  className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
                >
                  {showHeaderMap ? 'Hide Map' : 'Show Map'}
                </button>
                <button
                  type="button"
                  onClick={captureLocation}
                  className="text-cyan-400 hover:text-cyan-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="sm:hidden font-mono text-slate-300">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
              <span className={`font-semibold ${isHighAcc ? 'text-emerald-400' : 'text-rose-400'}`}>
                ● Accuracy: {isHighAcc ? 'High' : 'Low'} (~{accuracy || 95}m)
              </span>
            </div>

            {showHeaderMap && (
              <InlineLeafletMap
                lat={coords.lat}
                lng={coords.lng}
                title="Your Current GPS Position"
                heightClass="h-28 md:h-36"
              />
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Tabs */}
      <nav
        className={`md:hidden grid ${
          canAccessAdmin ? 'grid-cols-3' : 'grid-cols-2'
        } bg-white border-b border-slate-200 p-1 text-center text-xs font-bold text-slate-700 sticky top-0 z-20`}
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

      {/* Responsive Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex-1">
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

      {/* Centered Modal on Desktop, Bottom Sheet on Mobile */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const finalCategory =
                newType === '__OTHER__' ? customNewType.trim() : newType.trim();
              if (!finalCategory) {
                alert('Please specify the custom institution/business category.');
                return;
              }
              try {
                await apiFetch('/api/businesses', {
                  method: 'POST',
                  body: JSON.stringify({
                    name: newName,
                    business_type: finalCategory,
                    phone: newPhone,
                    address: newAddress,
                    lat: coords?.lat || 27.47528,
                    lng: coords?.lng || 94.90274,
                  }),
                });
                setShowAddModal(false);
                setNewName('');
                setCustomNewType('');
                setNewPhone('');
                setNewAddress('');
                queryClient.invalidateQueries({ queryKey: ['businesses'] });
              } catch (err) {
                alert(err.message || 'Failed to save location');
              }
            }}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-3.5 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-base text-slate-900">
                Add New Institution at Current GPS
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <input
              required
              placeholder="Institution Name (e.g., Dhemaji Public School)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {EXHAUSTIVE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__OTHER__" className="font-bold text-[#B91C1C]">
                + Other (Add Custom Type...)
              </option>
            </select>

            {newType === '__OTHER__' && (
              <input
                required
                placeholder="Enter custom category (e.g., Tea Estate, Silk Weaver...)"
                value={customNewType}
                onChange={(e) => setCustomNewType(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-amber-400 bg-amber-50/50 text-sm"
              />
            )}

            <input
              placeholder="Phone Number"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
            <input
              placeholder="Address / Area Description"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-slate-300 text-sm"
            />
            <button
              type="submit"
              className="w-full min-h-[48px] rounded-xl bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-sm shadow-sm cursor-pointer"
            >
              Save Location to Area Radar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// src/App.jsx — Official Postal Executive Theme (High-Contrast White Header, Visible Logo, Expanded Map)
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

  const [coords, setCoords] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [gpsStatus, setGpsStatus] = useState('Detecting live GPS...');
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
  const [customNewType, setCustomNewType] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const captureLocation = () => {
    setGpsStatus('Acquiring GPS lock...');
    if (!('geolocation' in navigator)) {
      setGpsStatus('GPS not supported by browser');
      return;
    }

    // Stage 1: Fast coarse/cached lock (<300ms) so leads load immediately
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const acc = Math.round(pos.coords.accuracy || 60);
        setCoords((prev) => prev || { lat, lng });
        setAccuracy((prev) => prev || acc);
        setGpsStatus('');
      },
      () => {},
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 120000 }
    );

    // Stage 2: High-accuracy satellite lock in parallel
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5));
        const lng = Number(pos.coords.longitude.toFixed(5));
        const acc = Math.round(pos.coords.accuracy || 20);
        setCoords({ lat, lng });
        setAccuracy(acc);
        setGpsStatus('');
        setSyncFlag((prev) => prev + 1);
      },
      () => {
        setGpsStatus((prev) => (coords ? '' : 'Please enable device Location / GPS and tap Refresh'));
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
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
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex items-center justify-center font-bold text-sm">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm p-2 mr-3 flex items-center justify-center">
          <img src="post-radar-mark.svg" className="w-full h-full object-contain animate-pulse" alt="Logo" />
        </div>
        Loading Post Radar...
      </div>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen w-full bg-slate-100 text-slate-900 p-6 flex items-center justify-center border-t-8 border-[#B91C1C]">
        <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-8 shadow-xl space-y-5 border border-slate-200">
          <div className="text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-amber-50 border-2 border-amber-300 p-2.5 mb-3 shadow-sm flex items-center justify-center">
              <img src="post-radar-mark.svg" className="w-full h-full object-contain" alt="Post Radar Logo" />
            </div>
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
      {/* Official Postal Executive Light Header — High Contrast for Logo Visibility */}
      <header className="bg-white text-slate-900 shadow-sm border-t-4 border-[#B91C1C] border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 space-y-3.5">
          {/* Top Bar: Logo, Title, Desktop Nav, Logout */}
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center space-x-3.5">
              {/* High-Contrast Logo Container */}
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border-2 border-amber-300 p-1.5 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src="post-radar-mark.svg"
                  className="w-full h-full object-contain"
                  alt="Post Radar Logo"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-[#B91C1C] leading-none">
                    Post Radar
                  </h1>
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-red-950 font-black text-[10px] uppercase tracking-wide">
                    India Post
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-semibold mt-1">
                  {user.full_name}{' '}
                  <span className="text-slate-400 font-normal">
                    ({user.role.replace('_', ' ')})
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <nav className="hidden md:flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('radar')}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'radar'
                      ? 'bg-[#B91C1C] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Radar Leads
                </button>
                <button
                  onClick={() => setActiveTab('diary')}
                  className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'diary'
                      ? 'bg-[#B91C1C] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  My Diary
                </button>
                {canAccessAdmin && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'admin'
                        ? 'bg-[#B91C1C] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Admin Panel
                  </button>
                )}
              </nav>

              <button
                onClick={handleLogout}
                className="min-h-[38px] px-3.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-[#B91C1C] border border-slate-200 font-bold text-xs cursor-pointer transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Clean GPS Bar & Expanded Map Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs space-y-3 shadow-inner">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C] animate-ping" />
                  GPS Location
                </span>
                <span className="font-mono text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-semibold">
                  {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : gpsStatus}
                </span>
                {coords && (
                  <span
                    className={`font-bold px-2.5 py-1 rounded-lg border ${
                      isHighAcc
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    ● Accuracy: {isHighAcc ? 'High' : 'Low'} (~{accuracy || 95}m)
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-auto">
                {coords && (
                  <button
                    type="button"
                    onClick={() => setShowHeaderMap(!showHeaderMap)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                  >
                    {showHeaderMap ? 'Hide Map' : 'Show Map'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={captureLocation}
                  className="px-3 py-1.5 rounded-lg bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  ↻ Refresh GPS
                </button>
              </div>
            </div>

            {/* EXPANDED MAP VIEW: Tall and clear (h-64 on mobile, h-72 on desktop) */}
            {coords && showHeaderMap && (
              <div className="rounded-xl overflow-hidden border border-slate-300 shadow-xs">
                <InlineLeafletMap
                  lat={coords.lat}
                  lng={coords.lng}
                  title="Your Current GPS Position"
                  heightClass="h-64 md:h-72"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Tabs */}
      <nav
        className={`md:hidden grid ${
          canAccessAdmin ? 'grid-cols-3' : 'grid-cols-2'
        } bg-white border-b border-slate-200 p-1.5 text-center text-xs font-bold text-slate-700 sticky top-0 z-20 shadow-xs`}
      >
        <button
          onClick={() => setActiveTab('radar')}
          className={`py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'radar' ? 'bg-[#B91C1C] text-white shadow-sm' : 'hover:bg-slate-50'
          }`}
        >
          Radar Leads
        </button>
        <button
          onClick={() => setActiveTab('diary')}
          className={`py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'diary' ? 'bg-[#B91C1C] text-white shadow-sm' : 'hover:bg-slate-50'
          }`}
        >
          My Diary
        </button>
        {canAccessAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-2.5 rounded-xl transition-all cursor-pointer ${
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

      {/* Add New Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!coords?.lat || !coords?.lng) {
                alert('Waiting for GPS coordinates. Please tap Refresh GPS first.');
                return;
              }
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
                    lat: coords.lat,
                    lng: coords.lng,
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

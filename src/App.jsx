import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceAndDirection } from './shared/geo.js';

// Pulled strictly from GitHub Actions Secrets at build time
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const API_URL = API_BASE;

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('post_radar_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export default function App() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // GPS Coordinates State (No Pincode)
  const [coords, setCoords] = useState({ lat: 27.4728, lng: 94.9120 });
  const [locStatus, setLocStatus] = useState('Acquiring GPS...');
  const [syncFlag, setSyncFlag] = useState(1);
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'diary' | 'admin'

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
    setLocStatus('Scanning GPS & MapmyIndia...');
    if (!('geolocation' in navigator)) {
      setCoords({ lat: 27.4728, lng: 94.9120 });
      setLocStatus('Simulated GPS (27.4728, 94.9120)');
      setSyncFlag((prev) => prev + 1);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setCoords({ lat, lng });
        setLocStatus(`GPS Locked (${lat.toFixed(4)}, ${lng.toFixed(4)}) ✓`);
        setSyncFlag((prev) => prev + 1);
      },
      () => {
        setCoords({ lat: 27.4728, lng: 94.9120 });
        setLocStatus('Default GPS (27.4728, 94.9120)');
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
    } catch (err) {
      // Ignore network errors on logout
    }
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

  return (
    <div className="min-h-screen max-w-[414px] mx-auto bg-slate-100 flex flex-col pb-20 shadow-xl">
      {/* Header */}
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

        {/* Live GPS Status Bar (Beat Pincode Removed) */}
        <div className="mt-3 p-3 rounded-xl bg-red-950/80 border border-red-400/30 flex items-center justify-between text-xs">
          <div>
            <span className="block text-[10px] uppercase font-bold text-red-200">
              MapmyIndia Live GPS Radar
            </span>
            <span className="font-bold text-amber-300">{locStatus}</span>
          </div>
          <button
            type="button"
            onClick={captureLocation}
            className="min-h-[38px] px-3 rounded-lg bg-amber-400 hover:bg-amber-500 text-red-950 font-extrabold text-xs shadow-sm transition-all"
          >
            📍 Scan Nearby
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
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

      {/* Main Content Area */}
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

      {/* Add Location Modal (No Pincode Input) */}
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
                    lat: coords?.lat || 27.4728,
                    lng: coords?.lng || 94.9120,
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
              <h3 className="font-bold text-base text-slate-900">Add New Institution at Current GPS</h3>
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

// --- RADAR VIEW ---
function RadarView({ coords, syncFlag, onOpenAddModal, user }) {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  const lat = coords?.lat || 27.4728;
  const lng = coords?.lng || 94.9120;

  const { data = { businesses: [] }, isLoading } = useQuery({
    queryKey: ['businesses', lat, lng, syncFlag],
    queryFn: () => apiFetch(`/api/businesses?lat=${lat}&lng=${lng}&sync=1`),
  });

  const { data: configsData = { configs: [] } } = useQuery({
    queryKey: ['configs'],
    queryFn: () => apiFetch('/api/admin/configs'),
  });

  const categories = ['ALL', 'School', 'Hospital', 'Bank', 'Police Station', 'Retail', 'Factory'];
  const businessesList = data?.businesses || [];
  const filtered =
    selectedTypeFilter === 'ALL'
      ? businessesList
      : businessesList.filter(
          (b) => b.business_type.toLowerCase() === selectedTypeFilter.toLowerCase()
        );

  return (
    <div className="space-y-3">
      {/* Action Bar (Pincode Filter Removed) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-2">
        <div>
          <span className="block text-xs font-bold text-slate-800">
            Nearby Institutions ({filtered.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Auto-discovered from GPS coordinates
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
          No institutions found in this category nearby. Tap "📍 Scan Nearby" or "＋ Add Location".
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

// --- BUSINESS CARD COMPONENT ---
function BusinessCard({ business, userCoords, orgConfigs, user }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [showPitch, setShowPitch] = useState(false);

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
  const mapplsUrl = business.mappls_eloc
    ? `https://mappls.com/${business.mappls_eloc}`
    : `https://www.mapmyindia.com/map?q=${business.lat},${business.lng}`;

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

      {/* MapmyIndia Link Button */}
      <div className="flex items-center gap-2">
        <a
          href={mapplsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 min-h-[44px] rounded-xl bg-amber-400 hover:bg-amber-500 text-red-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
        >
          🗺️ Open MapmyIndia Map Link
        </a>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
        >
          {expanded ? 'Hide Details ▲' : 'Expand Details ▼'}
        </button>
      </div>

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

// --- DIARY VIEW ---
function DiaryView({ user }) {
  const [mode, setMode] = useState('personal'); // 'personal' | 'divisional'
  const { data = { diary: [] }, isLoading } = useQuery({
    queryKey: ['diary', mode],
    queryFn: () => apiFetch(mode === 'divisional' ? '/api/diary/divisional' : '/api/diary'),
  });

  const diaryEntries = data?.diary || [];

  const exportDiaryToExcel = (entries) => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<?mso-application progid="Excel.Sheet"?>\n';
    xml +=
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xml += '<Styles>\n';
    xml +=
      '<Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#B91C1C" ss:Pattern="Solid"/><Alignment ss:Horizontal="Center"/></Style>\n';
    xml +=
      '<Style ss:ID="Cell"><Alignment ss:Vertical="Top"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/></Borders></Style>\n';
    xml += '</Styles>\n';
    xml += '<Worksheet ss:Name="Field Diary">\n<Table>\n';

    const headers = [
      'Date',
      'Executive',
      'Institution Name',
      'Category',
      'Phone',
      'Address',
      'Visit Status',
      'Visit Remark',
      'Diary Notes',
      'Next Follow-Up',
    ];
    xml +=
      '<Row>' +
      headers.map((h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${h}</Data></Cell>`).join('') +
      '</Row>\n';

    entries.forEach((e) => {
      const dateStr = new Date((e.visited_at || Date.now() / 1000) * 1000).toLocaleDateString();
      const rowData = [
        dateStr,
        e.executive_name || user.full_name,
        e.business_name || '',
        e.business_type || '',
        e.phone || '',
        e.address || '',
        e.is_visited ? 'Visited' : 'Pending',
        e.visit_remark || '',
        e.diary_details || '',
        e.next_follow_up_date || '',
      ];
      xml +=
        '<Row>' +
        rowData
          .map(
            (val) =>
              `<Cell ss:StyleID="Cell"><Data ss:Type="String">${String(val)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')}</Data></Cell>`
          )
          .join('') +
        '</Row>\n';
    });

    xml += '</Table>\n</Worksheet>\n</Workbook>';

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Post_Radar_Field_Diary_${mode}_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
            onClick={() => exportDiaryToExcel(diaryEntries)}
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

// --- ADMIN VIEW ---
function AdminView({ user }) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('executive');

  const { data: usersData = { users: [] } } = useQuery({
    queryKey: ['admin_users'],
    queryFn: () => apiFetch('/api/admin/users'),
  });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ username, password, full_name: fullName, role }),
      });
      setUsername('');
      setPassword('');
      setFullName('');
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      alert('User created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleCreateUser}
        className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3"
      >
        <h3 className="text-xs font-bold uppercase text-[#B91C1C]">Create User ID & Password</h3>
        <input
          required
          placeholder="Full Name (e.g., Priyam Baruah)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full min-h-[42px] px-3 rounded-xl border text-sm"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            required
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full min-h-[42px] px-3 rounded-xl border text-sm"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full min-h-[42px] px-3 rounded-xl border text-sm"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full min-h-[42px] px-3 rounded-xl border text-sm bg-white"
        >
          <option value="executive">Marketing Executive</option>
          <option value="admin">Divisional Admin</option>
          {user.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
        </select>
        <button
          type="submit"
          className="w-full min-h-[44px] rounded-xl bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-xs"
        >
          Create User Credentials
        </button>
      </form>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
        <h3 className="text-xs font-bold uppercase text-slate-700">Active User Roster</h3>
        <div className="space-y-2">
          {(usersData?.users || []).map((u) => (
            <div
              key={u.id}
              className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border text-xs"
            >
              <div>
                <p className="font-bold text-slate-900">
                  {u.full_name} ({u.username})
                </p>
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  {u.role.replace('_', ' ')}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

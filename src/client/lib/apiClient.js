import { generateDigipin, calculateHaversineMeters } from '../../shared/geo.js';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const DEMO_CONFIGS = [
  { id: 'cfg_01', business_type: 'Retail', recommended_product: 'India Post Parcel & COD (Cash on Delivery)', pitch_script: 'Namaskar! Do you ship orders across Assam or pan-India? With India Post Business Parcel & COD, we offer doorstep pickup above Rs 10,000 monthly volume and reach every pin code.' },
  { id: 'cfg_02', business_type: 'Factory', recommended_product: 'Logistics Post & Speed Post BNPL (Book Now Pay Later)', pitch_script: 'Hello! For bulk B2B dispatches and samples, our Book Now Pay Later (BNPL) corporate scheme gives you monthly billing, up to 30% volume discounts, and dedicated pickup.' },
  { id: 'cfg_03', business_type: 'Restaurant', recommended_product: 'Direct Post & Meghdoot Postcard Marketing', pitch_script: 'Hi! Launching a new menu or festive offer? With Direct Post, we deliver your flyers directly to every household in a specific Pin Code or DIGIPIN grid.' }
];
export async function apiFetch(path, options = {}) {
  const url = API_BASE + path;
  const token = localStorage.getItem('post_radar_token');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(options.headers || {}) };
  try {
    const res = await fetch(url, { ...options, headers, credentials: API_BASE ? 'include' : 'same-origin' });
    if (!(res.headers.get('content-type') || '').includes('application/json')) throw new Error('FALLBACK');
    return res;
  } catch { return handleFallback(path, options); }
}
function jsonRes(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }); }
async function handleFallback(path, options) {
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  if (path === '/api/auth/request-otp') return jsonRes({ message: 'OTP sent', dev_otp_hint: '123456' });
  if (path === '/api/auth/verify-otp') {
    const isAdmin = (body.email || '').includes('admin');
    const user = { id: isAdmin ? 'usr_admin_01' : 'usr_exec_01', organization_id: 'org_indiapost_assam_01', email: body.email, full_name: isAdmin ? 'Divisional Admin' : 'Field Marketing Executive', role: isAdmin ? 'admin' : 'executive' };
    localStorage.setItem('post_radar_demo_user', JSON.stringify(user));
    localStorage.setItem('post_radar_token', 'demo_token');
    return jsonRes({ token: 'demo_token', user });
  }
  if (path === '/api/auth/me') {
    const saved = localStorage.getItem('post_radar_demo_user');
    if (!saved) return jsonRes({ error: 'Unauthorized' }, 401);
    return jsonRes({ user: JSON.parse(saved), organization: { id: 'org_indiapost_assam_01', name: 'India Post - Assam Circle', circle_code: 'AS-01' } });
  }
  if (path === '/api/configs') {
    const stored = JSON.parse(localStorage.getItem('post_radar_demo_configs') || 'null') || DEMO_CONFIGS;
    if (method === 'POST') {
      const idx = stored.findIndex((c) => c.business_type.toLowerCase() === body.business_type.toLowerCase());
      const nextItem = { id: 'cfg_' + Date.now(), ...body };
      if (idx >= 0) stored[idx] = nextItem; else stored.push(nextItem);
      localStorage.setItem('post_radar_demo_configs', JSON.stringify(stored));
      return jsonRes({ success: true });
    }
    return jsonRes({ configs: stored });
  }
  if (path.startsWith('/api/businesses/nearby')) {
    const u = new URL(path, 'https://example.com');
    const lat = parseFloat(u.searchParams.get('lat') || '27.4728'), lng = parseFloat(u.searchParams.get('lng') || '94.9120');
    const offsets = [
      { name: 'Brahmaputra Handloom & Silk Emporium', type: 'Retail', dLat: 0.0008, dLng: 0.0006, phone: '+919435011223' },
      { name: 'Upper Assam Agro & Tea Packaging Unit', type: 'Factory', dLat: -0.0019, dLng: 0.0014, phone: '+919435188990' },
      { name: 'Khorikaa Heritage Kitchen', type: 'Restaurant', dLat: 0.0031, dLng: -0.0021, phone: '+919864022334' },
      { name: 'Eastern Medico & Surgical Distributors', type: 'Retail', dLat: -0.0042, dLng: -0.0018, phone: '+919435277665' }
    ];
    const businesses = offsets.map((o, i) => {
      const bLat = Number((lat + o.dLat).toFixed(6)), bLng = Number((lng + o.dLng).toFixed(6));
      return { id: 'biz_demo_' + (i + 1), name: o.name, business_type: o.type, phone: o.phone, lat: bLat, lng: bLng, digipin: generateDigipin(bLat, bLng), distance_meters: calculateHaversineMeters(lat, lng, bLat, bLng), last_visited_at: null, latest_notes: '' };
    }).sort((a, b) => a.distance_meters - b.distance_meters);
    return jsonRes({ businesses });
  }
  if (path === '/api/sync') return jsonRes({ success: true, synced_ids: (body.mutations || []).map((m) => m.id) });
  if (path === '/api/team') return jsonRes({ team: [{ id: 'usr_1', full_name: 'Divisional Admin', email: 'admin@indiapost.gov.in', role: 'admin' }] });
  return jsonRes({ ok: true });
}
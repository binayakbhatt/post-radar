// src/components/AdminView.jsx — Complete Admin Command Center with One-Click Database Export
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api.js';
import { EXHAUSTIVE_CATEGORIES } from '../lib/categories.js';

// Helper to safely convert an array of objects into an Excel-compatible CSV file download
function downloadCSV(filename, headers, rows) {
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map((h) => escapeCSV(h.label)).join(','),
    ...rows.map((row) => headers.map((h) => escapeCSV(row[h.key])).join(','))
  ].join('\r\n');

  // Add UTF-8 BOM (\uFEFF) so Microsoft Excel opens symbols & regional text cleanly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatUnixTimestamp(ts) {
  if (!ts) return '';
  try {
    return new Date(Number(ts) * 1000).toLocaleString('en-IN');
  } catch {
    return '';
  }
}

export default function AdminView({ user }) {
  const queryClient = useQueryClient();
  const [exportLoading, setExportLoading] = useState(false);

  // User Creation State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newDivision, setNewDivision] = useState('Dibrugarh Postal Division');
  const [newPosting, setNewPosting] = useState('Dhemaji Sub Division');
  const [newRole, setNewRole] = useState('executive');

  // Pitch Config State
  const [cfgType, setCfgType] = useState('School');
  const [cfgProduct, setCfgProduct] = useState('');
  const [cfgPitch, setCfgPitch] = useState('');

  // Fetch Users
  const { data: usersData = { users: [] } } = useQuery({
    queryKey: ['admin_users'],
    queryFn: () => apiFetch('/api/admin/users')
  });

  // Fetch Pitches
  const { data: configsData = { configs: [] } } = useQuery({
    queryKey: ['admin_configs'],
    queryFn: () => apiFetch('/api/admin/configs')
  });

  // Fetch Live Database Summary & Export Data
  const { data: exportData, refetch: refetchExport } = useQuery({
    queryKey: ['admin_export_summary'],
    queryFn: () => apiFetch('/api/admin/export')
  });

  const stats = exportData?.stats || {
    total_businesses: 0,
    me_added_businesses: 0,
    total_visited: 0,
    total_diary: 0,
    total_users: usersData.users?.length || 0
  };

  // Handler to fetch fresh DB snapshot and trigger selected download format
  const handleDownloadData = async (type) => {
    setExportLoading(true);
    try {
      const fresh = await apiFetch('/api/admin/export');
      const dateStamp = new Date().toISOString().slice(0, 10);

      if (type === 'businesses_csv') {
        const rows = (fresh.businesses || []).map((b) => ({
          ...b,
          source_type: b.created_by || String(b.id).startsWith('biz_me_') ? 'Staff Added (ME)' : 'OpenStreetMap Auto',
          added_by_name: b.added_by_name || 'System / OSM',
          is_visited_label: b.is_visited === 1 ? 'YES' : 'NO',
          added_to_diary_label: b.added_to_diary === 1 ? 'YES' : 'NO',
          updated_date: formatUnixTimestamp(b.updated_at),
          visited_date: formatUnixTimestamp(b.visited_at)
        }));

        downloadCSV(
          `PostRadar_All_Institutions_${dateStamp}.csv`,
          [
            { key: 'id', label: 'Record ID' },
            { key: 'name', label: 'Institution / Business Name' },
            { key: 'business_type', label: 'Category' },
            { key: 'source_type', label: 'Source' },
            { key: 'phone', label: 'Phone' },
            { key: 'address', label: 'Address / Area' },
            { key: 'pincode', label: 'Pincode' },
            { key: 'lat', label: 'Latitude' },
            { key: 'lng', label: 'Longitude' },
            { key: 'added_by_name', label: 'Added By Staff' },
            { key: 'added_by_posting', label: 'Added By Posting' },
            { key: 'is_visited_label', label: 'Visited?' },
            { key: 'visited_by_name', label: 'Visited By Officer' },
            { key: 'visited_by_posting', label: 'Visited By Posting' },
            { key: 'visit_remark', label: 'Visit Remark' },
            { key: 'next_follow_up_date', label: 'Next Follow-Up Date' },
            { key: 'added_to_diary_label', label: 'In Diary?' },
            { key: 'diary_details', label: 'Diary Notes' },
            { key: 'visited_date', label: 'Last Visit Timestamp' },
            { key: 'updated_date', label: 'Record Updated At' }
          ],
          rows
        );
      } else if (type === 'visits_csv') {
        const rows = (fresh.visits || []).map((v) => ({
          ...v,
          is_visited_label: v.is_visited === 1 ? 'Visited' : 'Pending',
          in_diary_label: v.added_to_diary === 1 ? 'Yes' : 'No',
          visited_date: formatUnixTimestamp(v.visited_at)
        }));

        downloadCSV(
          `PostRadar_Visits_And_Diary_${dateStamp}.csv`,
          [
            { key: 'visited_date', label: 'Date & Time' },
            { key: 'executive_name', label: 'Officer Name' },
            { key: 'place_of_posting', label: 'Place of Posting' },
            { key: 'division_name', label: 'Division' },
            { key: 'business_name', label: 'Institution Name' },
            { key: 'business_type', label: 'Category' },
            { key: 'phone', label: 'Phone' },
            { key: 'address', label: 'Address' },
            { key: 'is_visited_label', label: 'Visit Status' },
            { key: 'visit_remark', label: 'Visit Remarks / Outcome' },
            { key: 'next_follow_up_date', label: 'Next Follow-Up Date' },
            { key: 'in_diary_label', label: 'Saved in Diary?' },
            { key: 'diary_details', label: 'Diary Lead Details' },
            { key: 'lat', label: 'Latitude' },
            { key: 'lng', label: 'Longitude' }
          ],
          rows
        );
      } else if (type === 'users_csv') {
        const rows = (fresh.users || []).map((u) => ({
          ...u,
          status_label: u.is_active === 1 ? 'Active' : 'Inactive',
          created_date: formatUnixTimestamp(u.created_at)
        }));

        downloadCSV(
          `PostRadar_Staff_Roster_${dateStamp}.csv`,
          [
            { key: 'id', label: 'User ID' },
            { key: 'username', label: 'Username' },
            { key: 'full_name', label: 'Full Name' },
            { key: 'role', label: 'Role' },
            { key: 'place_of_posting', label: 'Place of Posting' },
            { key: 'division_name', label: 'Division' },
            { key: 'status_label', label: 'Status' },
            { key: 'created_date', label: 'Created On' }
          ],
          rows
        );
      } else if (type === 'full_json') {
        const blob = new Blob([JSON.stringify(fresh, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `PostRadar_Full_DB_Backup_${dateStamp}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      refetchExport();
    } catch (err) {
      alert('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          full_name: newFullName,
          division_name: newDivision,
          place_of_posting: newPosting,
          role: newRole
        })
      });
      setNewUsername('');
      setNewPassword('');
      setNewFullName('');
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      refetchExport();
      alert('Staff account created!');
    } catch (err) {
      alert(err.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}" permanently?`)) return;
    try {
      await apiFetch(`/api/admin/users?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
      refetchExport();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleSavePitch = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/configs', {
        method: 'POST',
        body: JSON.stringify({
          business_type: cfgType,
          recommended_product: cfgProduct,
          pitch_script: cfgPitch
        })
      });
      setCfgProduct('');
      setCfgPitch('');
      queryClient.invalidateQueries({ queryKey: ['admin_configs'] });
      alert('Pitch configuration updated!');
    } catch (err) {
      alert(err.message || 'Failed to save config');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. DIVISIONAL KPI OVERVIEW & DATA EXPORT CENTER */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-red-50 text-[#B91C1C] font-black text-[10px] uppercase tracking-wider border border-red-200">
              Divisional Oversight & Backup
            </span>
            <h2 className="text-lg font-black text-slate-900 mt-1">
              Database Export & Field Intelligence Summary
            </h2>
            <p className="text-xs text-slate-500">
              Download all institutions, field visits, diary follow-ups, and staff records in Excel-ready CSV or JSON format.
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetchExport()}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
          >
            ↻ Refresh Counts
          </button>
        </div>

        {/* Live Database KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Total Institutions</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total_businesses}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
            <p className="text-[11px] font-bold text-amber-900 uppercase">Staff Added (ME)</p>
            <p className="text-2xl font-black text-amber-800 mt-0.5">{stats.me_added_businesses}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <p className="text-[11px] font-bold text-emerald-900 uppercase">Visited Leads</p>
            <p className="text-2xl font-black text-emerald-700 mt-0.5">{stats.total_visited}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200">
            <p className="text-[11px] font-bold text-blue-900 uppercase">Diary Follow-Ups</p>
            <p className="text-2xl font-black text-blue-700 mt-0.5">{stats.total_diary}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 col-span-2 sm:col-span-1">
            <p className="text-[11px] font-bold text-purple-900 uppercase">Active Staff</p>
            <p className="text-2xl font-black text-purple-800 mt-0.5">{stats.total_users}</p>
          </div>
        </div>

        {/* One-Click Download Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <button
            type="button"
            disabled={exportLoading}
            onClick={() => handleDownloadData('businesses_csv')}
            className="flex flex-col items-start justify-between p-4 rounded-2xl bg-[#B91C1C] hover:bg-red-800 text-white text-left shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
              Master Excel CSV
            </span>
            <span className="font-bold text-sm mt-2">
              📥 Download All Institutions & Visits
            </span>
            <span className="text-[11px] text-red-100 mt-1">
              Includes GPS, category, added-by & visit status
            </span>
          </button>

          <button
            type="button"
            disabled={exportLoading}
            onClick={() => handleDownloadData('visits_csv')}
            className="flex flex-col items-start justify-between p-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-left shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
              Field Report CSV
            </span>
            <span className="font-bold text-sm mt-2">
              📥 Download Visits & Diary Log
            </span>
            <span className="text-[11px] text-emerald-100 mt-1">
              Officer-wise remarks & follow-up dates
            </span>
          </button>

          <button
            type="button"
            disabled={exportLoading}
            onClick={() => handleDownloadData('users_csv')}
            className="flex flex-col items-start justify-between p-4 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white text-left shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
              Staff Roster CSV
            </span>
            <span className="font-bold text-sm mt-2">
              📥 Download Staff Accounts
            </span>
            <span className="text-[11px] text-slate-300 mt-1">
              All executives, postings & divisions
            </span>
          </button>

          <button
            type="button"
            disabled={exportLoading}
            onClick={() => handleDownloadData('full_json')}
            className="flex flex-col items-start justify-between p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-slate-900 border-2 border-amber-300 text-left shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="text-xs font-black uppercase tracking-wider bg-amber-300/70 text-red-950 px-2 py-0.5 rounded-md">
              Full D1 Snapshot
            </span>
            <span className="font-bold text-sm mt-2">
              📦 Download Complete JSON Backup
            </span>
            <span className="text-[11px] text-slate-600 mt-1">
              Raw backup of all 4 database tables
            </span>
          </button>
        </div>
      </section>

      {/* 2. STAFF / USER MANAGEMENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-black text-base text-slate-900">
            Create Field Executive / Admin Account
          </h3>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                placeholder="Username (e.g., me_silapathar)"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-300 text-xs"
              />
              <input
                required
                type="password"
                placeholder="Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <input
              required
              placeholder="Officer Full Name"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-300 text-xs"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                placeholder="Division (e.g., Dibrugarh Division)"
                value={newDivision}
                onChange={(e) => setNewDivision(e.target.value)}
                className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-300 text-xs"
              />
              <input
                placeholder="Sub-Division / Office of Posting"
                value={newPosting}
                onChange={(e) => setNewPosting(e.target.value)}
                className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
            >
              <option value="executive">Marketing Executive / Field Staff</option>
              <option value="admin">Divisional / Sub-Divisional Admin</option>
              {user.role === 'super_admin' && (
                <option value="super_admin">Super Admin</option>
              )}
            </select>
            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              + Create User Account
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 space-y-2 max-h-72 overflow-y-auto">
            <p className="text-xs font-bold text-slate-500 uppercase">
              Registered Personnel ({usersData.users?.length || 0})
            </p>
            {(usersData.users || []).map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {u.full_name}{' '}
                    <span className="text-[#B91C1C] font-mono">(@{u.username})</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {u.place_of_posting || 'No Posting'} • {u.division_name || 'Assam Circle'} •{' '}
                    <span className="uppercase font-bold text-slate-700">{u.role}</span>
                  </p>
                </div>
                {u.id !== 'usr_super_01' && u.id !== user.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(u.id, u.full_name)}
                    className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 3. PITCH SCRIPT CONFIGURATOR */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-black text-base text-slate-900">
            Configure Product Pitch Scripts by Category
          </h3>
          <form onSubmit={handleSavePitch} className="space-y-3">
            <select
              value={cfgType}
              onChange={(e) => setCfgType(e.target.value)}
              className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
            >
              {EXHAUSTIVE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Recommended Product (e.g., PLI, RPLI, POSB Salary Account, Speed Post BNPL)"
              value={cfgProduct}
              onChange={(e) => setCfgProduct(e.target.value)}
              className="w-full min-h-[42px] px-3.5 rounded-xl border border-slate-300 text-xs"
            />
            <textarea
              required
              rows={3}
              placeholder="Enter talking points / pitch script for field officers..."
              value={cfgPitch}
              onChange={(e) => setCfgPitch(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-300 text-xs"
            />
            <button
              type="submit"
              className="w-full min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              Save Category Pitch Script
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100 space-y-2 max-h-72 overflow-y-auto">
            <p className="text-xs font-bold text-slate-500 uppercase">
              Active Pitch Scripts ({configsData.configs?.length || 0})
            </p>
            {(configsData.configs || []).map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900">{c.business_type}</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                    {c.recommended_product}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{c.pitch_script}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

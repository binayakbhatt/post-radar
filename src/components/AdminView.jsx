// src/components/AdminView.jsx
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api.js';

export default function AdminView({ user }) {
  const queryClient = useQueryClient();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('executive');

  const [bizType, setBizType] = useState('School');
  const [recommendedProduct, setRecommendedProduct] = useState('');
  const [pitchScript, setPitchScript] = useState('');

  const { data: usersData = { users: [] } } = useQuery({
    queryKey: ['admin_users'],
    queryFn: () => apiFetch('/api/admin/users'),
  });

  const { data: configsData = { configs: [] } } = useQuery({
    queryKey: ['admin_configs_manage'],
    queryFn: () => apiFetch('/api/admin/configs'),
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

  const handleDeleteUser = async (targetUser) => {
    if (
      !window.confirm(
        `Are you sure you want to delete user "${targetUser.full_name}" (@${targetUser.username})?`
      )
    ) {
      return;
    }
    try {
      await apiFetch(`/api/admin/users?id=${encodeURIComponent(targetUser.id)}`, {
        method: 'DELETE',
      });
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/configs', {
        method: 'POST',
        body: JSON.stringify({
          business_type: bizType,
          recommended_product: recommendedProduct,
          pitch_script: pitchScript,
        }),
      });
      setRecommendedProduct('');
      setPitchScript('');
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['admin_configs_manage'] });
      alert(`Pitch & Product configuration for ${bizType} updated successfully!`);
    } catch (err) {
      alert(err.message || 'Failed to update configuration');
    }
  };

  const handleSelectConfigToEdit = (config) => {
    setBizType(config.business_type);
    setRecommendedProduct(config.recommended_product);
    setPitchScript(config.pitch_script);
  };

  return (
    <div className="space-y-4 pb-10">
      <form
        onSubmit={handleSaveConfig}
        className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs"
      >
        <h3 className="text-xs font-bold uppercase text-[#B91C1C]">
          Configure Pitch & Products by Category
        </h3>
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Institution / Business Type
          </label>
          <select
            value={bizType}
            onChange={(e) => {
              const selectedType = e.target.value;
              setBizType(selectedType);
              const existing = (configsData?.configs || []).find(
                (c) => c.business_type.toLowerCase() === selectedType.toLowerCase()
              );
              if (existing) {
                setRecommendedProduct(existing.recommended_product);
                setPitchScript(existing.pitch_script);
              } else {
                setRecommendedProduct('');
                setPitchScript('');
              }
            }}
            className="w-full min-h-[42px] px-3 rounded-xl border text-sm bg-white"
          >
            <option value="School">School</option>
            <option value="Hospital">Hospital / Nursing</option>
            <option value="Bank">Bank</option>
            <option value="Police Station">Police Station</option>
            <option value="Fire Brigade">Fire Brigade</option>
            <option value="Retail">Retail Business</option>
            <option value="Factory">Factory / Industrial</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Recommended Product / Service
          </label>
          <input
            required
            placeholder="e.g., India Post Corporate Speed Post & Bulk Parcel"
            value={recommendedProduct}
            onChange={(e) => setRecommendedProduct(e.target.value)}
            className="w-full min-h-[42px] px-3 rounded-xl border text-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Pitch Script & Talking Points
          </label>
          <textarea
            required
            rows={3}
            placeholder="Enter standard pitch script for field executives..."
            value={pitchScript}
            onChange={(e) => setPitchScript(e.target.value)}
            className="w-full p-2.5 text-xs rounded-xl border bg-white"
          />
        </div>

        <button
          type="submit"
          className="w-full min-h-[44px] rounded-xl bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-xs shadow-sm"
        >
          Save / Update Category Pitch ✓
        </button>
      </form>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
        <h3 className="text-xs font-bold uppercase text-slate-700">Active Category Pitches</h3>
        <div className="space-y-2">
          {(configsData?.configs || []).map((cfg) => (
            <div
              key={cfg.id}
              onClick={() => handleSelectConfigToEdit(cfg)}
              className="p-3 rounded-xl bg-slate-50 border text-xs space-y-1 cursor-pointer hover:bg-red-50/50 transition-all"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-[#B91C1C] uppercase">{cfg.business_type}</span>
                <span className="text-[10px] text-slate-400 font-semibold">Tap to Edit ✏️</span>
              </div>
              <p className="font-bold text-slate-900">📦 {cfg.recommended_product}</p>
              <p className="text-slate-600 italic line-clamp-2">“{cfg.pitch_script}”</p>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleCreateUser}
        className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs"
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

      <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-xs">
        <h3 className="text-xs font-bold uppercase text-slate-700">Active User Roster</h3>
        <div className="space-y-2">
          {(usersData?.users || []).map((u) => {
            const isSelf = u.id === user.id;
            const isMasterAdmin = u.id === 'usr_super_01';
            const canDelete =
              !isSelf && !isMasterAdmin && (user.role === 'super_admin' || u.role !== 'super_admin');

            return (
              <div
                key={u.id}
                className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 border text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {u.full_name} <span className="text-slate-500 font-normal">(@{u.username})</span>
                  </p>
                  <span className="text-[10px] uppercase font-semibold text-slate-500">
                    {u.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Active
                  </span>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      className="min-h-[30px] px-2.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-[11px] transition-all"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

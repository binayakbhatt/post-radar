// src/components/AdminView.jsx
import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api.js';
import { EXHAUSTIVE_CATEGORIES } from '../lib/categories.js';

export default function AdminView({ user }) {
  const queryClient = useQueryClient();
  const pitchFormRef = useRef(null);
  const productInputRef = useRef(null);

  // User Creation State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [divisionName, setDivisionName] = useState('');
  const [placeOfPosting, setPlaceOfPosting] = useState('');
  const [role, setRole] = useState('executive');

  // Pitch & Product Config State
  const [bizType, setBizType] = useState('School');
  const [customBizType, setCustomBizType] = useState('');
  const [recommendedProduct, setRecommendedProduct] = useState('');
  const [pitchScript, setPitchScript] = useState('');
  const [editingConfigId, setEditingConfigId] = useState(null);

  const { data: usersData = { users: [] } } = useQuery({
    queryKey: ['admin_users'],
    queryFn: () => apiFetch('/api/admin/users'),
  });

  const { data: configsData = { configs: [] } } = useQuery({
    queryKey: ['admin_configs_manage'],
    queryFn: () => apiFetch('/api/admin/configs'),
  });

  // Merge standard exhaustive list with any custom categories already saved in DB
  const allCategories = useMemo(() => {
    const set = new Set(EXHAUSTIVE_CATEGORIES);
    (configsData?.configs || []).forEach((c) => {
      if (c.business_type) set.add(c.business_type.trim());
    });
    return Array.from(set);
  }, [configsData]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          full_name: fullName,
          division_name: divisionName,
          place_of_posting: placeOfPosting,
          role,
        }),
      });
      setUsername('');
      setPassword('');
      setFullName('');
      setDivisionName('');
      setPlaceOfPosting('');
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
    const finalBizType = bizType === '__OTHER__' ? customBizType.trim() : bizType.trim();
    if (!finalBizType) {
      alert('Please enter a custom business/institution type.');
      return;
    }

    try {
      await apiFetch('/api/admin/configs', {
        method: 'POST',
        body: JSON.stringify({
          business_type: finalBizType,
          recommended_product: recommendedProduct,
          pitch_script: pitchScript,
        }),
      });
      setEditingConfigId(null);
      setBizType(finalBizType);
      setCustomBizType('');
      queryClient.invalidateQueries({ queryKey: ['configs'] });
      queryClient.invalidateQueries({ queryKey: ['admin_configs_manage'] });
      alert(`Pitch & Product configuration for "${finalBizType}" updated successfully!`);
    } catch (err) {
      alert(err.message || 'Failed to update configuration');
    }
  };

  const handleSelectConfigToEdit = (config) => {
    const matchedType =
      allCategories.find(
        (t) => t.toLowerCase() === (config.business_type || '').trim().toLowerCase()
      ) || config.business_type;

    setEditingConfigId(config.id);
    setBizType(matchedType);
    setCustomBizType('');
    setRecommendedProduct(config.recommended_product || '');
    setPitchScript(config.pitch_script || '');

    if (pitchFormRef.current) {
      pitchFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      productInputRef.current?.focus();
    }, 300);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-10 items-start">
      {/* LEFT COLUMN: PITCH & PRODUCT CONFIGURATOR */}
      <div className="space-y-4">
        <form
          ref={pitchFormRef}
          onSubmit={handleSaveConfig}
          className={`bg-white p-4 rounded-2xl border transition-all space-y-3 shadow-xs ${
            editingConfigId ? 'border-[#B91C1C] ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase text-[#B91C1C]">
              {editingConfigId
                ? `Editing Pitch: ${bizType === '__OTHER__' ? customBizType : bizType}`
                : 'Configure Pitch & Products by Category'}
            </h3>
            {editingConfigId && (
              <button
                type="button"
                onClick={() => {
                  setEditingConfigId(null);
                  setRecommendedProduct('');
                  setPitchScript('');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Institution / Business Type
            </label>
            <select
              value={bizType}
              onChange={(e) => {
                const selectedType = e.target.value;
                setBizType(selectedType);
                if (selectedType === '__OTHER__') {
                  setEditingConfigId(null);
                  setCustomBizType('');
                  setRecommendedProduct('');
                  setPitchScript('');
                  return;
                }
                const existing = (configsData?.configs || []).find(
                  (c) => c.business_type.toLowerCase() === selectedType.toLowerCase()
                );
                if (existing) {
                  setEditingConfigId(existing.id);
                  setRecommendedProduct(existing.recommended_product);
                  setPitchScript(existing.pitch_script);
                } else {
                  setEditingConfigId(null);
                  setRecommendedProduct('');
                  setPitchScript('');
                }
              }}
              className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="__OTHER__" className="font-bold text-[#B91C1C]">
                + Other (Add Custom Category...)
              </option>
            </select>
          </div>

          {bizType === '__OTHER__' && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
              <label className="block text-[11px] font-bold text-amber-950">
                Enter New Custom Category Name
              </label>
              <input
                required
                placeholder="e.g., Bamboo Processing Unit, Army Cantonment, Cold Storage..."
                value={customBizType}
                onChange={(e) => setCustomBizType(e.target.value)}
                className="w-full min-h-[40px] px-3 rounded-xl border border-amber-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#B91C1C]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Recommended Product / Service
            </label>
            <input
              ref={productInputRef}
              required
              placeholder="e.g., India Post Corporate Speed Post & Bulk Parcel"
              value={recommendedProduct}
              onChange={(e) => setRecommendedProduct(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]"
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
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#B91C1C]"
            />
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-xs shadow-sm cursor-pointer transition-all"
          >
            Save / Update Category Pitch ✓
          </button>
        </form>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
          <h3 className="text-xs font-bold uppercase text-slate-700">
            Active Category Pitches ({(configsData?.configs || []).length})
          </h3>
          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {(configsData?.configs || []).map((cfg) => {
              const isSelected = editingConfigId === cfg.id;
              return (
                <div
                  key={cfg.id}
                  onClick={() => handleSelectConfigToEdit(cfg)}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-red-50/80 border-[#B91C1C] ring-1 ring-[#B91C1C]'
                      : 'bg-slate-50 border-slate-200 hover:bg-red-50/40 hover:border-red-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[#B91C1C] uppercase">{cfg.business_type}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectConfigToEdit(cfg);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-red-950 font-bold text-[11px] shadow-2xs cursor-pointer transition-all"
                    >
                      ✏️ Edit Pitch
                    </button>
                  </div>
                  <p className="font-bold text-slate-900">📦 {cfg.recommended_product}</p>
                  <p className="text-slate-600 italic line-clamp-2">“{cfg.pitch_script}”</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: USER CREATION & ACTIVE ROSTER */}
      <div className="space-y-4">
        <form
          onSubmit={handleCreateUser}
          className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-xs"
        >
          <h3 className="text-xs font-bold uppercase text-[#B91C1C]">Create User ID & Password</h3>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name</label>
            <input
              required
              placeholder="e.g., Priyam Baruah"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Division Name
              </label>
              <input
                required
                placeholder="e.g., Dibrugarh Division"
                value={divisionName}
                onChange={(e) => setDivisionName(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Place of Posting
              </label>
              <input
                required
                placeholder="e.g., Dhemaji Sub Division"
                value={placeOfPosting}
                onChange={(e) => setPlaceOfPosting(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Username</label>
              <input
                required
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Password</label>
              <input
                required
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Access Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full min-h-[42px] px-3 rounded-xl border border-slate-300 text-sm bg-white"
            >
              <option value="executive">Marketing Executive</option>
              <option value="admin">Divisional Admin</option>
              {user.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
            </select>
          </div>

          <button
            type="submit"
            className="w-full min-h-[44px] rounded-xl bg-[#B91C1C] hover:bg-red-800 text-white font-bold text-xs cursor-pointer transition-all"
          >
            Create User Credentials
          </button>
        </form>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2.5 shadow-xs">
          <h3 className="text-xs font-bold uppercase text-slate-700">Active User Roster</h3>
          <div className="space-y-2">
            {(usersData?.users || []).map((u) => {
              const isSelf = u.id === user.id;
              const isMasterAdmin = u.id === 'usr_super_01';
              const canDelete =
                !isSelf &&
                !isMasterAdmin &&
                (user.role === 'super_admin' || u.role !== 'super_admin');

              return (
                <div
                  key={u.id}
                  className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs gap-2"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">
                      {u.full_name}{' '}
                      <span className="text-slate-500 font-normal">(@{u.username})</span>
                    </p>
                    {(u.division_name || u.place_of_posting) && (
                      <p className="text-[11px] text-slate-600 font-medium">
                        📍 {[u.place_of_posting, u.division_name].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    <span className="inline-block text-[10px] uppercase font-bold text-[#B91C1C]">
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Active
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        className="min-h-[30px] px-2.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-bold text-[11px] transition-all cursor-pointer"
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
    </div>
  );
}

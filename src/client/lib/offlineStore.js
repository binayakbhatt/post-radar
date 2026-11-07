import localforage from 'localforage';
import { generateDigipin } from '../../shared/geo.js';
import { apiFetch } from './apiClient.js';

export const leadsStore = localforage.createInstance({ name: 'PostRadarDB', storeName: 'businesses_cache' });
export const configsStore = localforage.createInstance({ name: 'PostRadarDB', storeName: 'org_configs_cache' });
export const syncQueueStore = localforage.createInstance({ name: 'PostRadarDB', storeName: 'mutation_queue' });

export async function saveNoteOfflineFirst(businessId, notes) {
  const nowMs = Date.now(), nowSec = Math.floor(nowMs / 1000);
  const cachedBiz = (await leadsStore.getItem(businessId)) || { id: businessId };
  const updatedBiz = { ...cachedBiz, latest_notes: notes, last_visited_at: nowSec, updated_at: nowSec, sync_pending: true };
  await leadsStore.setItem(businessId, updatedBiz);
  await syncQueueStore.setItem('mut_' + businessId, { id: 'mut_' + businessId, type: 'UPSERT_NOTE', timestamp: nowMs, payload: { business_id: businessId, notes } });
  if (navigator.onLine) flushMutationQueue().catch(() => {});
  return updatedBiz;
}
export async function createLeadOfflineFirst({ name, business_type, phone, lat, lng, notes }) {
  const nowSec = Math.floor(Date.now() / 1000), id = 'biz_local_' + Date.now();
  const newBiz = { id, name, business_type, phone, lat, lng, digipin: generateDigipin(lat, lng), last_visited_at: nowSec, latest_notes: notes || '', distance_meters: 0, sync_pending: true };
  await leadsStore.setItem(id, newBiz);
  return newBiz;
}
export async function flushMutationQueue() {
  const mutations = [];
  await syncQueueStore.iterate((v) => { mutations.push(v); });
  if (!mutations.length) return;
  const res = await apiFetch('/api/sync', { method: 'POST', body: JSON.stringify({ mutations }) });
  if (res.ok) {
    const data = await res.json();
    for (const id of data.synced_ids || []) await syncQueueStore.removeItem(id);
  }
}
const DIGIPIN_GRID = [
  ['F', 'C', '9', '8'],
  ['J', '3', '2', '7'],
  ['K', '4', '5', '6'],
  ['L', 'M', 'P', 'T']
];
export function generateDigipin(lat, lng) {
  let minLat = 2.5, maxLat = 38.5, minLng = 63.5, maxLng = 99.5;
  if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) return 'OUT-OF-INDIA';
  let code = '';
  for (let level = 1; level <= 10; level++) {
    const latStep = (maxLat - minLat) / 4, lngStep = (maxLng - minLng) / 4;
    let row = Math.min(3, Math.max(0, Math.floor((lat - minLat) / latStep)));
    let col = Math.min(3, Math.max(0, Math.floor((lng - minLng) / lngStep)));
    code += DIGIPIN_GRID[3 - row][col];
    minLat += row * latStep; maxLat = minLat + latStep;
    minLng += col * lngStep; maxLng = minLng + lngStep;
  }
  return code.slice(0, 3) + '-' + code.slice(3, 6) + '-' + code.slice(6, 10);
}
export function calculateHaversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
export function getBoundingBox(lat, lng, radiusMeters = 1000) {
  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  return { minLat: lat - latDelta, maxLat: lat + latDelta, minLng: lng - lngDelta, maxLng: lng + lngDelta };
}
export function encodeGeohash(lat, lng, precision = 7) {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let idx = 0, bit = 0, evenBit = true, geohash = '', latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
  while (geohash.length < precision) {
    if (evenBit) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) { idx = idx * 2 + 1; lngMin = mid; } else { idx *= 2; lngMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { idx = idx * 2 + 1; latMin = mid; } else { idx *= 2; latMax = mid; }
    }
    evenBit = !evenBit;
    if (++bit === 5) { geohash += BASE32.charAt(idx); bit = 0; idx = 0; }
  }
  return geohash;
}
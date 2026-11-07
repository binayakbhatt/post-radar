/**
 * Calculate distance in meters between two lat/lng points using Haversine formula.
 * @param {number} lat1 - Latitude 1
 * @param {number} lng1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lng2 - Longitude 2
 * @returns {number} Distance in meters
 */
export function calculateHaversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculate 8-point compass direction from point A to point B.
 * @param {number} lat1 
 * @param {number} lng1 
 * @param {number} lat2 
 * @param {number} lng2 
 * @returns {string} Compass direction sector (N, NE, E, SE, S, SW, W, NW)
 */
export function getCompassDirection(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);

  let brng = toDeg(Math.atan2(y, x));
  brng = (brng + 360) % 360;

  const sectors = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  return sectors[Math.round(brng / 45)];
}

/**
 * Format distance and direction string.
 */
export function formatDistanceAndDirection(lat1, lng1, lat2, lng2) {
  const meters = calculateHaversineMeters(lat1, lng1, lat2, lng2);
  const dir = getCompassDirection(lat1, lng1, lat2, lng2);
  const distStr = meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
  return `${distStr} (${dir})`;
}

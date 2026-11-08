// src/components/InlineLeafletMap.jsx
import React, { useEffect, useRef } from 'react';

let leafletPromise = null;
function loadLeafletAssets() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
  return leafletPromise;
}

export default function InlineLeafletMap({
  lat,
  lng,
  userLat,
  userLng,
  title,
  heightClass = 'h-36',
  showRouteLine = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    loadLeafletAssets().then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          zoomControl: false,
          attributionControl: true,
        }).setView([lat, lng], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap',
        }).addTo(mapInstanceRef.current);
      } else {
        mapInstanceRef.current.setView([lat, lng], 15);
      }

      const map = mapInstanceRef.current;

      map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      const isBusinessTarget = Boolean(showRouteLine && userLat && userLng);
      const mainMarker = L.circleMarker([lat, lng], {
        radius: 9,
        fillColor: isBusinessTarget ? '#B91C1C' : '#10B981',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95,
      }).addTo(map);

      if (title) {
        mainMarker.bindPopup(`<b>${title}</b>`);
      }

      if (isBusinessTarget) {
        L.circleMarker([userLat, userLng], {
          radius: 7,
          fillColor: '#10B981',
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9,
        })
          .bindPopup('Your GPS Location')
          .addTo(map);

        const line = L.polyline(
          [
            [userLat, userLng],
            [lat, lng],
          ],
          { color: '#B91C1C', weight: 2, dashArray: '4, 6' }
        ).addTo(map);

        map.fitBounds(line.getBounds(), { padding: [24, 24], maxZoom: 16 });
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    });

    return () => {
      isMounted = false;
    };
  }, [lat, lng, userLat, userLng, title, showRouteLine]);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-300 shadow-inner bg-slate-200 z-0">
      <div ref={mapContainerRef} className={`w-full ${heightClass}`} />
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, useMapEvents } from 'react-leaflet';
import { FloatControlsInner } from '@/components/toolbar/FloatControls';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function createBuildingIcon(count, isSelected) {
  const bg = isSelected ? '#1e293b' : '#ff001e';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${bg};
      color: white;
      border-radius: 12px;
      padding: 4px 10px;
      font-size: 13px;
      font-weight: 600;
      font-family: Poppins, sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      border: 2px solid white;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/></svg>
      ${count}
    </div>`,
    iconSize: [60, 30],
    iconAnchor: [30, 15],
  });
}

function createAnalogIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: #3b82f6;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function PolygonDrawer({ isDrawing, onPolygonComplete, polygonPoints, setPolygonPoints, drawingEnabledAt }) {
  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      // Ignore clicks within 300ms of enabling drawing (to avoid button click registering as map click)
      if (Date.now() - drawingEnabledAt < 300) return;
      const newPoints = [...polygonPoints, [e.latlng.lat, e.latlng.lng]];
      setPolygonPoints(newPoints);
    }
  });

  if (polygonPoints.length < 2) return null;
  return <Polygon positions={polygonPoints} pathOptions={{ color: '#ff001e', fillColor: '#ff001e', fillOpacity: 0.15, weight: 2 }} />;
}

function FloatControlsWrapper({ onFavorites, onToggleDrawing, isDrawing }) {
  const map = useMap();
  const [mounted, setMounted] = React.useState(false);
  const container = React.useRef(null);

  React.useEffect(() => {
    container.current = document.createElement('div');
    container.current.style.cssText = 'position:absolute;right:16px;top:50%;transform:translateY(-50%);z-index:1000;pointer-events:all;';
    map.getContainer().appendChild(container.current);
    setMounted(true);
    return () => {
      if (container.current && map.getContainer().contains(container.current)) {
        map.getContainer().removeChild(container.current);
      }
    };
  }, [map]);

  if (!mounted || !container.current) return null;

  return createPortal(
    <FloatControlsInner
      onFavorites={onFavorites}
      onToggleDrawing={onToggleDrawing}
      isDrawing={isDrawing}
      onZoomIn={() => map.zoomIn()}
      onZoomOut={() => map.zoomOut()}
    />,
    container.current
  );
}

function FitBounds({ buildings }) {
  const map = useMap();
  useEffect(() => {
    if (buildings.length > 0) {
      const bounds = buildings.map(b => [b.lat, b.lng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, []);
  return null;
}

// IDW interpolation heatmap rendered on canvas
function heatColorRGB(t) {
  // blue(0) -> cyan -> green -> yellow -> red(1)
  const stops = [
    [0,   0,   0, 255],
    [0.25, 0, 200, 150],
    [0.5, 80, 220,  0],
    [0.75, 255, 180,  0],
    [1,   255,   0,  0],
  ];
  let i = 0;
  while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
  const [t0, r0, g0, b0] = stops[i];
  const [t1, r1, g1, b1] = stops[i + 1];
  const u = (t - t0) / (t1 - t0);
  return [
    Math.round(r0 + u * (r1 - r0)),
    Math.round(g0 + u * (g1 - g0)),
    Math.round(b0 + u * (b1 - b0)),
  ];
}

function HeatmapLayer({ buildings, heatMode }) {
  const map = useMap(); // eslint-disable-line
  const canvasRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!buildings.length) return;

    // Create canvas overlay layer
    const CanvasLayer = L.Layer.extend({
      onAdd(map) {
        const canvas = L.DomUtil.create('canvas', '');
        canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:400;';
        map.getPanes().overlayPane.appendChild(canvas);
        canvasRef.current = canvas;
        map.on('moveend zoomend resize', this._draw, this);
        this._draw();
      },
      onRemove(map) {
        if (canvasRef.current) {
          canvasRef.current.remove();
          canvasRef.current = null;
        }
        map.off('moveend zoomend resize', this._draw, this);
      },
      _draw() {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const mapSize = map.getSize();
        canvas.width = mapSize.x;
        canvas.height = mapSize.y;

        const topLeft = map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(canvas, topLeft);

        const ctx = canvas.getContext('2d');

        // Compute getValue
        let getValue;
        if (heatMode === 'price') {
          const districtPrices = { 'Центр': 130000, 'Верх-Исетский': 110000, 'ВИЗ': 105000, 'Октябрьский': 85000, 'Уралмаш': 85000, 'Ленинский': 85000 };
          getValue = b => districtPrices[b.district] || 85000;
        } else if (heatMode === 'count') {
          getValue = b => b.flat_count || 1;
        } else if (heatMode === 'year') {
          getValue = b => b.year_built || 2000;
        } else {
          getValue = b => b.metro_distance_min ? 1 / b.metro_distance_min : 0;
        }

        const values = buildings.map(getValue);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);

        // Project buildings to pixel coords
        const pts = buildings.map((b, i) => {
          const lp = map.latLngToContainerPoint([b.lat, b.lng]);
          return { x: lp.x, y: lp.y, t: maxVal === minVal ? 0.5 : (values[i] - minVal) / (maxVal - minVal) };
        });

        // Draw at reduced resolution then scale up for performance
        const STEP = 6;
        const imgW = Math.ceil(mapSize.x / STEP);
        const imgH = Math.ceil(mapSize.y / STEP);
        const imageData = ctx.createImageData(imgW, imgH);
        const data = imageData.data;

        for (let py = 0; py < imgH; py++) {
          for (let px = 0; px < imgW; px++) {
            const cx = px * STEP;
            const cy = py * STEP;

            // IDW interpolation (power=2)
            let wSum = 0, vSum = 0;
            for (const p of pts) {
              const dx = cx - p.x;
              const dy = cy - p.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < 1) { wSum = 1e9; vSum = p.t * 1e9; break; }
              const w = 1 / d2;
              wSum += w;
              vSum += w * p.t;
            }
            const t = wSum > 0 ? vSum / wSum : 0.5;
            const [r, g, b] = heatColorRGB(Math.max(0, Math.min(1, t)));
            const idx = (py * imgW + px) * 4;
            data[idx]     = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 160;
          }
        }

        // Draw scaled up
        const offscreen = document.createElement('canvas');
        offscreen.width = imgW;
        offscreen.height = imgH;
        offscreen.getContext('2d').putImageData(imageData, 0, 0);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(offscreen, 0, 0, imgW, imgH, 0, 0, mapSize.x, mapSize.y);
      }
    });

    const layer = new CanvasLayer();
    layerRef.current = layer;
    layer.addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [buildings, heatMode, map]);

  return null;
}

function FlyToLocation({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], 16, { duration: 1.2 });
    }
  }, [target]);
  return null;
}

export default function MapView({
  buildings,
  selectedBuildingId,
  onBuildingClick,
  analogFlats = [],
  isDrawing,
  polygonPoints,
  setPolygonPoints,
  onPolygonComplete,
  savedPolygon,
  onFavorites,
  onToggleDrawing,
  searchTarget,
  drawingEnabledAt,
  heatMode,
}) {
  return (
    <MapContainer
      center={[56.8380, 60.5970]}
      zoom={13}
      zoomControl={false}
      className="w-full h-full z-0"
      style={{ minHeight: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        subdomains="abc"
        maxZoom={19}
        crossOrigin="anonymous"
      />
      <FitBounds buildings={buildings} />
      <FlyToLocation target={searchTarget} />

      {heatMode && <HeatmapLayer buildings={buildings} heatMode={heatMode} />}

      {buildings.map(b => (
        <Marker
          key={b.id}
          position={[b.lat, b.lng]}
          icon={createBuildingIcon(b.flat_count, b.id === selectedBuildingId)}
          eventHandlers={{ click: () => onBuildingClick(b) }}
        >
          <Popup>
            <div className="font-inter text-sm">
              <p className="font-semibold">{b.address}</p>
              <p className="text-muted-foreground">{b.district} · {b.flat_count} квартир</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {analogFlats.map(f => (
        <Marker
          key={f.id}
          position={[f.lat, f.lng]}
          icon={createAnalogIcon()}
        >
          <Popup>
            <div className="font-inter text-sm">
              <p className="font-semibold">{f.address}</p>
              <p>{f.rooms}к · {f.area} м²</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {savedPolygon && savedPolygon.length > 2 && (
        <Polygon positions={savedPolygon} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2 }} />
      )}

      <PolygonDrawer
        isDrawing={isDrawing}
        polygonPoints={polygonPoints}
        setPolygonPoints={setPolygonPoints}
        onPolygonComplete={onPolygonComplete}
        drawingEnabledAt={drawingEnabledAt}
      />

      {/* Float controls inside map (needs useMap) */}
      <FloatControlsWrapper
        onFavorites={onFavorites}
        onToggleDrawing={onToggleDrawing}
        isDrawing={isDrawing}
      />
    </MapContainer>
  );
}
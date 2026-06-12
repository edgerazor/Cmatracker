import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";

export interface MapListing {
  listingKey: string;
  address: string | null;
  status: string; // Active | Pending | Closed
  price: number | null;
  sqft?: number | null;
  beds?: number | null;
  baths?: number | null;
  dom?: number | null;
  lat: number | null;
  lng: number | null;
  photo?: string | null;
}

export interface SubjectHome {
  lat: number;
  lng: number;
  address: string;
  photo?: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  Active: "#2563eb",
  Pending: "#d97706",
  Closed: "#16a34a",
};

/** Pulsing home icon for the subject property */
const homeIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:36px;height:36px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:#e11d48;opacity:.25;animation:homePulse 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:5px;border-radius:50%;background:#e11d48;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:13px;">🏠</div>
    </div>
    <style>@keyframes homePulse{0%{transform:scale(.8);opacity:.5}100%{transform:scale(2);opacity:0}}</style>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function FitBounds({ listings, subject }: { listings: MapListing[]; subject?: SubjectHome | null }) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = listings
      .filter((l) => l.lat != null && l.lng != null)
      .map((l) => [l.lat!, l.lng!]);
    if (subject) pts.push([subject.lat, subject.lng]);
    if (pts.length === 0) return;
    if (pts.length === 1) { map.setView(pts[0], 14); return; }
    map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 15 });
  }, [listings, subject, map]);
  return null;
}

export default function MarketMap({
  listings,
  subject,
  height = "100%",
  onSelect,
}: {
  listings: MapListing[];
  subject?: SubjectHome | null;
  height?: string;
  onSelect?: (listingKey: string) => void;
}) {
  const center: [number, number] = subject
    ? [subject.lat, subject.lng]
    : [49.1659, -123.9401]; // Nanaimo

  return (
    <div style={{ height }} className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%", background: "#dbeafe" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <FitBounds listings={listings} subject={subject} />

        {listings.map((l) =>
          l.lat != null && l.lng != null ? (
            <CircleMarker
              key={l.listingKey}
              center={[l.lat, l.lng]}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: STATUS_COLOR[l.status] ?? "#64748b",
                fillOpacity: 0.95,
              }}
              eventHandlers={onSelect ? { click: () => onSelect(l.listingKey) } : undefined}
            >
              <Popup>
                <div style={{ fontFamily: "Inter, sans-serif", minWidth: 180 }}>
                  {l.photo && (
                    <img src={l.photo} alt="" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 6, marginBottom: 6 }} />
                  )}
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{l.address}</div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                    <b style={{ color: STATUS_COLOR[l.status] }}>{l.status === "Closed" ? "SOLD" : l.status.toUpperCase()}</b>
                    {" · "}${l.price?.toLocaleString() ?? "—"}
                    {l.sqft ? ` · ${l.sqft.toLocaleString()} sqft` : ""}
                  </div>
                  {l.beds != null && (
                    <div style={{ fontSize: 11, color: "#777", marginTop: 2 }}>
                      {l.beds} bed · {l.baths} bath {l.dom != null ? `· ${l.dom} DOM` : ""}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          ) : null
        )}

        {subject && (
          <Marker position={[subject.lat, subject.lng]} icon={homeIcon} zIndexOffset={1000}>
            <Popup>
              <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13 }}>
                {subject.address}
                <div style={{ fontSize: 11, color: "#b8860b", fontWeight: 600, marginTop: 2 }}>Your home</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl px-3.5 py-2 flex items-center gap-3.5 shadow-md">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{ background: color }} />
            <span className="text-[11px] font-semibold text-slate-600">
              {status === "Closed" ? "Sold" : status}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
          <span className="text-xs">🏠</span>
          <span className="text-[11px] font-semibold text-slate-600">Your home</span>
        </div>
      </div>
    </div>
  );
}

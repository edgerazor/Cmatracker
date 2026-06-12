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
  Active: "#58a6ff",
  Pending: "#f0b429",
  Closed: "#3fb950",
};

/** Pulsing home icon for the subject property */
const homeIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:34px;height:34px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:#f0b429;opacity:.25;animation:homePulse 2s ease-out infinite;"></div>
      <div style="position:absolute;inset:5px;border-radius:50%;background:#f0b429;border:2.5px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;font-size:12px;">🏠</div>
    </div>
    <style>@keyframes homePulse{0%{transform:scale(.8);opacity:.5}100%{transform:scale(2);opacity:0}}</style>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
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
    <div style={{ height }} className="relative rounded-xl overflow-hidden border border-[#30363d]">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%", background: "#0d1117" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds listings={listings} subject={subject} />

        {listings.map((l) =>
          l.lat != null && l.lng != null ? (
            <CircleMarker
              key={l.listingKey}
              center={[l.lat, l.lng]}
              radius={8}
              pathOptions={{
                color: "#0d1117",
                weight: 1.5,
                fillColor: STATUS_COLOR[l.status] ?? "#8b949e",
                fillOpacity: 0.9,
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
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#0d1117]/90 backdrop-blur-sm border border-[#30363d] rounded-lg px-3 py-2 flex items-center gap-3">
        {Object.entries(STATUS_COLOR).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px] font-semibold text-[#8b949e]">
              {status === "Closed" ? "Sold" : status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

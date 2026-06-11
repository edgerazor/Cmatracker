import { useEffect, useState } from "react";
import { MlsProperty, effectivePrice, psf, num } from "./types";

interface Props {
  property: MlsProperty | null;
  isSelected: boolean;
  onClose: () => void;
  onToggle: (p: MlsProperty) => void;
}

export default function PropertyDetail({ property, isSelected, onClose, onToggle }: Props) {
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => { setPhotoIdx(0); }, [property?.listingKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const photos = property?.photoUrls?.length
    ? property.photoUrls
    : property?.mainPhotoUrl
      ? [property.mainPhotoUrl]
      : [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          property ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[440px] max-w-[92vw] bg-[#0d1117] border-l border-[#30363d] z-50 shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${
          property ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {property && (
          <>
            {/* Photo carousel */}
            <div className="relative h-64 bg-[#161b22] group">
              {photos.length > 0 ? (
                <img src={photos[photoIdx]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#30363d] text-4xl">🏠</div>
              )}
              {photos.length > 1 && (
                <>
                  <CarouselBtn side="left" onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)} />
                  <CarouselBtn side="right" onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)} />
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white/90 text-[10px] font-semibold px-2 py-0.5 rounded-full tabular-nums">
                    {photoIdx + 1} / {photos.length}
                  </div>
                </>
              )}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/60 text-white/80 hover:bg-black/80 hover:text-white transition-colors text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-white leading-tight">{property.address}</h2>
                  <p className="text-xs text-[#8b949e] mt-1">
                    {property.subArea} · {property.propertySubType} · MLS® {property.mlsNumber ?? "—"}
                  </p>
                </div>
                <StatusBadge status={property.status} />
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-extrabold text-white tabular-nums">
                  ${effectivePrice(property)?.toLocaleString() ?? "—"}
                </span>
                {psf(property) && (
                  <span className="text-sm font-bold text-[#58a6ff] tabular-nums">
                    ${Math.round(psf(property)!)}/sqft
                  </span>
                )}
              </div>
              {property.status === "Closed" && num(property.listPrice) !== num(property.closePrice) && (
                <p className="text-xs text-[#484f58] mt-1 tabular-nums">
                  Listed at ${num(property.listPrice)?.toLocaleString()}
                </p>
              )}

              {/* Key facts grid */}
              <div className="grid grid-cols-3 gap-2 mt-5">
                <Fact label="Beds" value={property.bedrooms} />
                <Fact label="Baths" value={property.bathrooms} />
                <Fact label="Fin SqFt" value={property.squareFeet?.toLocaleString()} />
                <Fact label="Year Built" value={property.yearBuilt} />
                <Fact label="DOM" value={property.daysOnMarket} />
                <Fact label="Garage" value={property.garageSpaces} />
                <Fact label="Layout" value={property.layout} wide />
                <Fact
                  label="Assessed"
                  value={num(property.taxAssessedValue) ? `$${num(property.taxAssessedValue)!.toLocaleString()}` : null}
                />
              </div>

              {/* Remarks */}
              {property.publicRemarks && (
                <div className="mt-5">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#484f58] mb-2">
                    Public Remarks
                  </div>
                  <p className="text-xs text-[#8b949e] leading-relaxed">{property.publicRemarks}</p>
                </div>
              )}

              {/* Action */}
              <button
                onClick={() => onToggle(property)}
                className={`w-full mt-6 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                  isSelected
                    ? "bg-[#21262d] text-[#f85149] border border-[#30363d] hover:border-[#da3633]"
                    : "bg-gradient-to-r from-[#388bfd] to-[#58a6ff] text-white shadow-lg shadow-[#388bfd]/25 hover:shadow-[#388bfd]/40 hover:-translate-y-px"
                }`}
              >
                {isSelected ? "Remove from CMA" : "＋ Add to CMA"}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function CarouselBtn({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 ${side === "left" ? "left-2" : "right-2"} w-8 h-8 rounded-full bg-black/50 text-white/80 hover:bg-black/75 hover:text-white opacity-0 group-hover:opacity-100 transition-all text-sm`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-[#1f3a5f] text-[#58a6ff] border-[#388bfd]",
    Pending: "bg-[#3d2e00] text-[#f0b429] border-[#d29922]",
    Closed: "bg-[#1e3a1e] text-[#3fb950] border-[#3fb950]",
  };
  return (
    <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md border ${map[status] ?? "bg-[#21262d] text-[#8b949e] border-[#30363d]"}`}>
      {status === "Closed" ? "SOLD" : status.toUpperCase()}
    </span>
  );
}

function Fact({ label, value, wide }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`bg-[#161b22] border border-[#21262d] rounded-lg px-3 py-2 ${wide ? "col-span-2" : ""}`}>
      <div className="text-[9px] font-bold uppercase tracking-wider text-[#484f58]">{label}</div>
      <div className="text-xs font-bold text-white mt-0.5 truncate">{value ?? "—"}</div>
    </div>
  );
}

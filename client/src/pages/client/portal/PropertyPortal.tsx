import { useState } from "react";
import MarketTab from "./MarketTab";
import EvaluationTab from "./EvaluationTab";
import SellerOverview from "./SellerOverview";
import BuyerHomeTab from "./BuyerHomeTab";
import DocumentsTab from "./DocumentsTab";

export interface PropertyBundle {
  property: any;
  cmaReport: any;
  comparables: any[];
  showings: any[];
  probabilityConfig: any;
  homeComponents: any[];
  documents: any[];
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  cma: { label: "EVALUATED", color: "#a371f7", bg: "#2d1b4e" },
  active: { label: "LISTED · ACTIVE", color: "#58a6ff", bg: "#1f3a5f" },
  sold: { label: "SOLD", color: "#3fb950", bg: "#1e3a1e" },
  purchased: { label: "YOUR HOME", color: "#f0b429", bg: "#3d2e00" },
};

export default function PropertyPortal({ bundle }: { bundle: PropertyBundle }) {
  const p = bundle.property;
  const status = p.status as string;
  const meta = STATUS_META[status] ?? STATUS_META.cma;

  // Tab sets per lifecycle state
  const tabs: { id: string; label: string }[] =
    status === "active"
      ? [
          { id: "overview", label: "Overview" },
          { id: "market", label: "Market Activity" },
          { id: "evaluation", label: "Your Evaluation" },
          { id: "documents", label: "Documents" },
        ]
      : status === "purchased"
        ? [
            { id: "myhome", label: "My Home" },
            { id: "market", label: "Area Activity" },
            { id: "documents", label: "Documents" },
          ]
        : [
            { id: "market", label: "Market Activity" },
            { id: "evaluation", label: "Your Evaluation" },
          ];

  const [tab, setTab] = useState(tabs[0].id);
  const [evalRequested, setEvalRequested] = useState(false);

  const subject =
    p.latitude && p.longitude
      ? { lat: p.latitude, lng: p.longitude, address: p.address }
      : null;

  const daysOnMarket = p.listDate
    ? Math.floor((Date.now() - new Date(p.listDate).getTime()) / 86400_000)
    : 0;

  const requestEvaluation = async () => {
    await fetch("/api/portal/request-evaluation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: p.id }),
    });
    setEvalRequested(true);
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden border border-[#30363d] mb-6">
        <div className="relative h-56 md:h-72 bg-[#161b22]">
          {p.photoUrl ? (
            <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#161b22] to-[#1c2333] flex items-center justify-center text-6xl opacity-30">
              🏠
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/40 to-transparent" />
        </div>
        <div className="absolute bottom-0 inset-x-0 p-5 md:p-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <span
              className="inline-block text-[9px] font-bold px-2.5 py-1 rounded-full border mb-2 tracking-widest"
              style={{ color: meta.color, borderColor: meta.color, background: meta.bg }}
            >
              {meta.label}
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              {p.address}
            </h1>
            <p className="text-xs text-[#8b949e] mt-1">
              {p.subArea?.replace(/^Na /, "")} · {p.bedrooms} bed · {p.bathroomsFull} bath ·{" "}
              {p.sqft?.toLocaleString()} sqft
              {p.yearBuilt ? ` · Built ${p.yearBuilt}` : ""}
              {p.mlsNumber ? ` · MLS® ${p.mlsNumber}` : ""}
            </p>
          </div>
          {status === "active" && p.listPrice && (
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#8b949e]">Listed at</div>
              <div className="text-2xl md:text-3xl font-extrabold text-white tabular-nums">
                ${p.listPrice.toLocaleString()}
              </div>
            </div>
          )}
          {status === "purchased" && p.soldDate && (
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-widest text-[#8b949e]">Home since</div>
              <div className="text-lg font-extrabold text-white">
                {new Date(p.soldDate).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#21262d]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative px-4 py-2.5 text-xs font-bold transition-colors ${
              tab === t.id ? "text-white" : "text-[#484f58] hover:text-[#8b949e]"
            }`}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute bottom-0 inset-x-2 h-0.5 bg-gradient-to-r from-[#388bfd] to-[#58a6ff] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && status === "active" && (
        <SellerOverview
          probabilityPct={bundle.probabilityConfig?.baselinePct ?? bundle.cmaReport?.probabilityPct ?? 50}
          listPrice={p.listPrice}
          daysOnMarket={daysOnMarket}
          showings={bundle.showings}
        />
      )}
      {tab === "market" && <MarketTab propertyId={p.id} subject={subject} />}
      {tab === "evaluation" && (
        <>
          {evalRequested && (
            <div className="mb-4 bg-[#1e3a1e] border border-[#3fb950] rounded-xl px-4 py-3 text-xs text-[#3fb950] font-semibold">
              ✓ Request sent — your agent will be in touch shortly to arrange your updated evaluation.
            </div>
          )}
          <EvaluationTab
            report={bundle.cmaReport}
            comparables={bundle.comparables}
            onRequestUpdate={requestEvaluation}
            showRequestButton={status === "cma" && !evalRequested}
          />
        </>
      )}
      {tab === "myhome" && <BuyerHomeTab components={bundle.homeComponents} />}
      {tab === "documents" && <DocumentsTab documents={bundle.documents} />}
    </div>
  );
}

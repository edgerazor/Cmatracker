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

const STATUS_META: Record<string, { label: string; cls: string }> = {
  cma: { label: "EVALUATED", cls: "bg-violet-100 text-violet-700 border-violet-200" },
  active: { label: "LISTED · ACTIVE", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  sold: { label: "SOLD", cls: "bg-green-100 text-green-700 border-green-200" },
  purchased: { label: "YOUR HOME", cls: "bg-amber-100 text-amber-700 border-amber-200" },
};

export default function PropertyPortal({ bundle }: { bundle: PropertyBundle }) {
  const p = bundle.property;
  const status = p.status as string;
  const meta = STATUS_META[status] ?? STATUS_META.cma;

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
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-md mb-6 bg-white">
        <div className="relative h-60 md:h-80 bg-slate-100">
          {p.photoUrl ? (
            <img src={p.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center text-6xl opacity-40">
              🏠
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        </div>
        <div className="absolute bottom-0 inset-x-0 p-5 md:p-7 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full border mb-2 tracking-widest bg-white/90 backdrop-blur-sm ${meta.cls}`}>
              {meta.label}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-sm">
              {p.address}
            </h1>
            <p className="text-xs md:text-sm text-white/80 mt-1.5 font-medium">
              {p.subArea?.replace(/^Na /, "")} · {p.bedrooms} bed · {p.bathroomsFull} bath ·{" "}
              {p.sqft?.toLocaleString()} sqft
              {p.yearBuilt ? ` · Built ${p.yearBuilt}` : ""}
              {p.mlsNumber ? ` · MLS® ${p.mlsNumber}` : ""}
            </p>
          </div>
          {status === "active" && p.listPrice && (
            <div className="text-right bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-md">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Listed at</div>
              <div className="text-xl md:text-2xl font-extrabold text-slate-900 tabular-nums">
                ${p.listPrice.toLocaleString()}
              </div>
            </div>
          )}
          {status === "purchased" && p.soldDate && (
            <div className="text-right bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-md">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Home since</div>
              <div className="text-base md:text-lg font-extrabold text-slate-900">
                {new Date(p.soldDate).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm w-fit max-w-full overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === t.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {t.label}
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
            <div className="mb-4 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-xs text-green-700 font-semibold">
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

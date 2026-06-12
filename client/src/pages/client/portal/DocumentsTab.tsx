interface Doc {
  id: number;
  title: string;
  category: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
}

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  contract: { label: "Contract", icon: "📝" },
  inspection: { label: "Inspection", icon: "🔍" },
  disclosure: { label: "Disclosure", icon: "📋" },
  warranty: { label: "Warranty", icon: "🛡️" },
  other: { label: "Document", icon: "📄" },
};

export default function DocumentsTab({ documents }: { documents: Doc[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Your important paperwork, all in one place.</p>
      {documents.map((d) => {
        const meta = CATEGORY_META[d.category] ?? CATEGORY_META.other;
        return (
          <a
            key={d.id}
            href={d.fileUrl}
            className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 hover:border-blue-300 hover:shadow-md transition-all group shadow-sm"
          >
            <span className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg">
              {meta.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {d.title}
              </div>
              <div className="text-[11px] text-slate-400">
                {meta.label} · {d.fileName}
              </div>
            </div>
            <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors text-sm">
              ↓
            </span>
          </a>
        );
      })}
      {documents.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-400">No documents yet.</div>
      )}
    </div>
  );
}

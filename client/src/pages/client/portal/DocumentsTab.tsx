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
      <p className="text-xs text-[#8b949e]">
        Your important paperwork, all in one place.
      </p>
      {documents.map((d) => {
        const meta = CATEGORY_META[d.category] ?? CATEGORY_META.other;
        return (
          <a
            key={d.id}
            href={d.fileUrl}
            className="flex items-center gap-3 bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3.5 hover:border-[#388bfd] transition-colors group"
          >
            <span className="text-lg">{meta.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white group-hover:text-[#58a6ff] transition-colors">
                {d.title}
              </div>
              <div className="text-[10px] text-[#484f58]">
                {meta.label} · {d.fileName}
              </div>
            </div>
            <span className="text-[#484f58] group-hover:text-[#58a6ff] transition-colors text-sm">↓</span>
          </a>
        );
      })}
      {documents.length === 0 && (
        <div className="text-center py-12 text-xs text-[#484f58]">No documents yet.</div>
      )}
    </div>
  );
}

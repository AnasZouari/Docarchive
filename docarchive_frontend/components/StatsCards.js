'use client';

const cards = [
  {
    key: 'total',
    label: 'Total documents',
    icon: '📄',
    tone: 'bg-blue-50 text-blue-700',
    hint: 'In your workspace',
  },
  {
    key: 'active',
    label: 'Active documents',
    icon: '✓',
    tone: 'bg-emerald-50 text-emerald-700',
    hint: 'Ready to access',
  },
  {
    key: 'archived',
    label: 'Archived',
    icon: '▣',
    tone: 'bg-amber-50 text-amber-700',
    hint: 'Kept for later',
  },
  {
    key: 'totalSize',
    label: 'Storage used',
    icon: '↗',
    tone: 'bg-violet-50 text-violet-700',
    hint: 'Across all documents',
  },
];

export default function StatsCards({ stats, loading }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium text-slate-600">
              {card.label}
            </span>

            <span
              aria-hidden="true"
              className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-semibold ${card.tone}`}
            >
              {card.icon}
            </span>
          </div>

          {loading ? (
            <div className="mt-5 h-9 w-20 animate-pulse rounded-md bg-slate-100" />
          ) : (
            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
              {stats?.[card.key] ??
                (card.key === 'totalSize' ? '0 B' : 0)}
            </p>
          )}

          <p className="mt-1 text-xs text-slate-500">
            {card.hint}
          </p>
        </div>
      ))}
    </div>
  );
}
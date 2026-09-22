'use client';

export default function StatsCards({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total Documents', value: stats?.total || 0, className: 'stat-card-blue' },
    { label: 'Active', value: stats?.active || 0, className: 'stat-card-green' },
    { label: 'Archived', value: stats?.archived || 0, className: 'stat-card-yellow' },
    { label: 'Total Size', value: stats?.totalSize || '0 B', className: 'stat-card-purple' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className={`${card.className} stat-card`}>
          <h3 className="stat-number">{card.value}</h3>
          <p className="stat-label">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
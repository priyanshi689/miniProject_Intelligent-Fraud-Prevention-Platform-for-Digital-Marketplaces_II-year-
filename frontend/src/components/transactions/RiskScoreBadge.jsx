export default function RiskScoreBadge({ score, level }) {
  const colors = {
    critical: 'bg-red-900 text-red-300 border-red-700',
    high: 'bg-orange-900 text-orange-300 border-orange-700',
    medium: 'bg-yellow-900 text-yellow-300 border-yellow-700',
    low: 'bg-green-900 text-green-300 border-green-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border font-mono ${colors[level] || colors.low}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {score ? (score * 100).toFixed(0) + '%' : level}
    </span>
  );
}

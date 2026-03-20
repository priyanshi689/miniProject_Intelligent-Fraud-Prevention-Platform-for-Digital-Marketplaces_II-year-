import { ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';

const StatCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
      </div>
      <div className={`p-2 rounded-lg bg-gray-800`}><Icon size={20} className={color} /></div>
    </div>
  </div>
);

export default function RiskOverview({ summary }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Transactions" value={summary.total?.toLocaleString()} icon={TrendingUp} color="text-blue-400" sub={`$${(summary.totalAmount/1000).toFixed(1)}k total volume`} />
      <StatCard label="Blocked" value={summary.blocked?.toLocaleString()} icon={ShieldAlert} color="text-red-400" sub="Auto-blocked by system" />
      <StatCard label="Flagged for Review" value={summary.flagged?.toLocaleString()} icon={AlertTriangle} color="text-amber-400" sub="Pending analyst review" />
      <StatCard label="Fraud Rate" value={`${summary.fraudRate}%`} icon={ShieldCheck} color="text-green-400" sub={`${summary.approved?.toLocaleString()} approved`} />
    </div>
  );
}

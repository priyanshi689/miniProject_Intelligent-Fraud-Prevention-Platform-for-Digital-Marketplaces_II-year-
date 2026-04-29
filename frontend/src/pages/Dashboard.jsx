import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "https://fraud-backend-lb7d.onrender.com";

function StatCard({ label, value, sub, icon, color }) {
  const colors = {
    blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/30",   text: "text-blue-400"   },
    red:    { bg: "bg-red-500/10",    border: "border-red-500/30",    text: "text-red-400"    },
    yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
    green:  { bg: "bg-green-500/10",  border: "border-green-500/30",  text: "text-green-400"  },
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`rounded-xl border p-5 ${c.bg} ${c.border} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${c.text}`}>{value}</div>
      <div className="text-xs text-gray-500">{sub}</div>
    </div>
  );
}

function RiskBadge({ level }) {
  const map = {
    critical: "bg-red-500/20 text-red-300 border-red-500/40",
    high:     "bg-orange-500/20 text-orange-300 border-orange-500/40",
    medium:   "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    low:      "bg-green-500/20 text-green-300 border-green-500/40",
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${map[level] || map.low}`}>
      {level}
    </span>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
      <span className="text-4xl">📊</span>
      <p className="text-sm">No data yet</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      axios.get(`${API}/api/transactions/stats/summary`, { headers }),
      axios.get(`${API}/api/fraud/trend?days=7`, { headers }),
      axios.get(`${API}/api/fraud/distribution`, { headers }),
      axios.get(`${API}/api/transactions?limit=5&sort=-createdAt`, { headers }),
    ])
      .then(([s, t, d, r]) => {
        // FIX 1: API wraps data in .data.data
        setStats(s.data.data);

        const trendData = Array.isArray(t.data) ? t.data : t.data?.data || [];
        setTrend(
          trendData.map((item) => ({
            date: item._id || item.date || item.day,
            Total: item.total ?? item.count ?? 0,
            Flagged: item.flagged ?? item.fraud ?? 0,
          }))
        );

        const distData = Array.isArray(d.data) ? d.data : d.data?.data || [];
        setDistribution(
          distData.map((item) => ({
            name: (item._id || item.level || "").toUpperCase(),
            count: item.count ?? 0,
          }))
        );

        setRecentTxns(r.data?.data || r.data?.transactions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const DIST_COLORS = { LOW: "#22c55e", MEDIUM: "#eab308", HIGH: "#f97316", CRITICAL: "#ef4444" };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex gap-2 items-center text-gray-400">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fraud Intelligence Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time platform overview</p>
        </div>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Live</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Transactions"
          value={stats?.total?.toLocaleString() ?? "—"}
          // FIX 2: API returns totalAmount not totalVolume
          sub={`$${((stats?.totalAmount || 0) / 1000).toFixed(1)}k volume`}
          icon="📈"
          color="blue"
        />
        <StatCard
          label="Blocked"
          value={stats?.blocked ?? 0}
          sub="Auto-blocked by system"
          icon="🛡️"
          color="red"
        />
        <StatCard
          label="Flagged for Review"
          value={stats?.flagged ?? 0}
          sub="Pending analyst review"
          icon="⚠️"
          color="yellow"
        />
        <StatCard
          label="Fraud Rate"
          // FIX 3: API returns fraudRate as a % string already e.g. "12.50"
          value={`${stats?.fraudRate || "0.00"}%`}
          sub={`${stats?.approved ?? 0} approved`}
          icon="✅"
          color="green"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Fraud Trend (7 days)</h2>
          <div className="h-52">
            {trend.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFlagged" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                  <Area type="monotone" dataKey="Total" stroke="#3b82f6" fill="url(#gTotal)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="Flagged" stroke="#ef4444" fill="url(#gFlagged)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Risk Distribution</h2>
          <div className="h-52">
            {distribution.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distribution.map((entry) => (
                      <Cell key={entry.name} fill={DIST_COLORS[entry.name] || "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">Recent Transactions</h2>
          <a href="/transactions" className="text-xs text-blue-400 hover:underline">View all →</a>
        </div>
        {recentTxns.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-600 text-sm">No transactions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Transaction ID</th>
                  <th className="text-left px-5 py-3">Amount</th>
                  <th className="text-left px-5 py-3">Risk Score</th>
                  <th className="text-left px-5 py-3">Risk Level</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTxns.map((txn, i) => (
                  <tr key={txn._id || i} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-400">
                      #{(txn.transactionId || txn._id || "").slice(-10)}
                    </td>
                    <td className="px-5 py-3 font-semibold text-white">
                      ${(txn.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full w-16">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(txn.riskScore || 0) * 100}%`,
                              backgroundColor:
                                txn.riskScore > 0.85 ? "#ef4444" :
                                txn.riskScore > 0.65 ? "#f97316" :
                                txn.riskScore > 0.4  ? "#eab308" : "#22c55e",
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">
                          {((txn.riskScore || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><RiskBadge level={txn.riskLevel || "low"} /></td>
                    <td className="px-5 py-3 capitalize text-gray-300 text-xs">{txn.status}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {txn.createdAt ? new Date(txn.createdAt).toLocaleTimeString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

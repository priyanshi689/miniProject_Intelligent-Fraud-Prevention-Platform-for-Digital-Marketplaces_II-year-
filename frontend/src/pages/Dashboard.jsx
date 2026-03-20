import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSummary, fetchTrend, fetchDistribution } from '../store/fraudSlice';
import RiskOverview from '../components/dashboard/RiskOverview';
import FraudTrendChart from '../components/dashboard/FraudTrendChart';
import LiveAlertFeed from '../components/dashboard/LiveAlertFeed';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const RISK_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };

export default function Dashboard() {
  const dispatch = useDispatch();
  const { summary, trend, distribution, loading } = useSelector(s => s.fraud);

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchTrend(7));
    dispatch(fetchDistribution());
  }, [dispatch]);

  if (loading && !summary) return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Fraud Intelligence Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time platform overview</p>
      </div>
      <RiskOverview summary={summary} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><FraudTrendChart data={trend} /></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={distribution}>
              <XAxis dataKey="_id" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {distribution?.map((d) => <Cell key={d._id} fill={RISK_COLORS[d._id] || '#6b7280'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <LiveAlertFeed />
    </div>
  );
}

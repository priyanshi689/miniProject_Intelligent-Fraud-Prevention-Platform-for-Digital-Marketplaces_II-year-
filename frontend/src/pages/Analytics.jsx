import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrend, fetchDistribution } from '../store/fraudSlice';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function Analytics() {
  const dispatch = useDispatch();
  const { trend, distribution } = useSelector(s => s.fraud);
  useEffect(() => { dispatch(fetchTrend(30)); dispatch(fetchDistribution()); }, [dispatch]);
  const formatted = trend?.map(d => ({ ...d, date: format(parseISO(d._id), 'MMM d') })) || [];
  const COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">30-Day Transaction Volume & Fraud Rate</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={formatted}>
            <defs>
              <linearGradient id="colTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colFlagged" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
            <Area type="monotone" dataKey="total" stroke="#3b82f6" fill="url(#colTotal)" name="Total" />
            <Area type="monotone" dataKey="flagged" stroke="#ef4444" fill="url(#colFlagged)" name="Flagged" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Risk Level Breakdown</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={distribution} layout="vertical">
            <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis dataKey="_id" type="category" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
            <Bar dataKey="count" radius={[0,4,4,0]}>
              {distribution?.map(d => <Cell key={d._id} fill={COLORS[d._id] || '#6b7280'} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

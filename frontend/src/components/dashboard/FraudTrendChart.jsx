import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function FraudTrendChart({ data }) {
  const formatted = data?.map(d => ({ ...d, date: format(parseISO(d._id), 'MMM d') })) || [];
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-white font-semibold mb-4">Fraud Trend (7 days)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
          <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
          <Legend />
          <Line type="monotone" dataKey="total" stroke="#3b82f6" dot={false} name="Total Txns" />
          <Line type="monotone" dataKey="flagged" stroke="#ef4444" dot={false} name="Flagged" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

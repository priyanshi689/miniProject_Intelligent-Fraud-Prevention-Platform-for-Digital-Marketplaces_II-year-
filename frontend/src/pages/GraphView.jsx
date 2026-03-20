import { useState } from 'react';
import { graphAPI } from '../services/api';
import { Network, Search } from 'lucide-react';

export default function GraphView() {
  const [userId, setUserId] = useState('');
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchGraph = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    try {
      const res = await graphAPI.getUserGraph(userId, 2);
      setGraphData(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const NODE_COLORS = { user: '#ef4444', connected_user: '#f97316', transaction: '#3b82f6' };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Fraud Ring Graph</h1>
      <div className="flex gap-3">
        <input value={userId} onChange={e => setUserId(e.target.value)} placeholder="Enter User ID to visualize..."
          className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500" />
        <button onClick={fetchGraph} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          <Search size={16} /> {loading ? 'Loading...' : 'Build Graph'}
        </button>
      </div>
      {graphData && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="text-gray-400">Nodes: <span className="text-white">{graphData.stats?.totalNodes}</span></span>
            <span className="text-gray-400">Connections: <span className="text-white">{graphData.stats?.totalEdges}</span></span>
          </div>
          <div className="overflow-auto">
            <div className="flex flex-wrap gap-3">
              {graphData.nodes?.map(n => (
                <div key={n.id} className="border rounded-lg px-3 py-2 text-xs" style={{ borderColor: NODE_COLORS[n.type] + '60', backgroundColor: NODE_COLORS[n.type] + '15' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[n.type] }} />
                    <span className="text-gray-300 capitalize">{n.type?.replace('_',' ')}</span>
                  </div>
                  <p className="font-mono text-gray-400">{n.id?.slice(0,16)}...</p>
                  {n.riskScore > 0 && <p style={{ color: NODE_COLORS[n.type] }}>Risk: {(n.riskScore * 100).toFixed(0)}%</p>}
                </div>
              ))}
            </div>
            {graphData.edges?.length > 0 && (
              <div className="mt-5 border-t border-gray-800 pt-4">
                <p className="text-gray-400 text-xs mb-2">Connections ({graphData.edges.length})</p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {graphData.edges.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-mono">{e.source?.slice(0,12)}</span>
                      <span className="px-2 py-0.5 bg-gray-800 rounded text-amber-400">{e.type?.replace('_',' ')}</span>
                      <span className="font-mono">{e.target?.slice(0,12)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {!graphData && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center gap-3">
          <Network size={40} className="text-gray-700" />
          <p className="text-gray-500 text-sm">Enter a User ID above to visualize their fraud graph</p>
        </div>
      )}
    </div>
  );
}

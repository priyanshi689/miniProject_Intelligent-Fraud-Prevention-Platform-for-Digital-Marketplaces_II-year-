import { useState, useEffect } from 'react';
import { graphAPI, transactionAPI } from '../services/api';
import { Network, Search, ChevronDown, User, AlertTriangle } from 'lucide-react';

export default function GraphView() {
  const [userId, setUserId] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [users, setUsers] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(true);

  // Fetch unique users from transactions
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await transactionAPI.getAll({ limit: 500 });
        const txns = res.data?.data || res.data?.transactions || [];
        // Deduplicate by userId
        const seen = new Set();
        const unique = [];
        for (const tx of txns) {
          const uid = tx.userId?._id || tx.userId;
          if (uid && !seen.has(uid.toString())) {
            seen.add(uid.toString());
            unique.push({
              id: uid.toString(),
              label: tx.userId?.email || tx.userId?.name || uid.toString().slice(0, 16) + '...',
              riskScore: tx.riskScore,
            });
          }
        }
        setUsers(unique);
      } catch (e) {
        console.error('Failed to fetch users', e);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const selectUser = (user) => {
    setUserId(user.id);
    setSelectedLabel(user.label);
    setDropdownOpen(false);
    setGraphData(null);
  };

  const fetchGraph = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    try {
      const res = await graphAPI.getUserGraph(userId, 2);
      setGraphData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const NODE_COLORS = {
    user: '#ef4444',
    connected_user: '#f97316',
    transaction: '#3b82f6',
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Fraud Ring Graph</h1>

      <div className="flex gap-3">
        {/* User Dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500 hover:border-gray-500 transition-colors"
          >
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              <span className={selectedLabel ? 'text-white' : 'text-gray-500'}>
                {usersLoading ? 'Loading users...' : selectedLabel || 'Select a user to visualize...'}
              </span>
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              {users.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No users found</div>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-gray-300 font-mono">{user.id.slice(0, 20)}...</span>
                    </div>
                    {user.riskScore > 0.65 && (
                      <AlertTriangle size={12} className="text-amber-400" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Manual ID input fallback */}
        <input
          value={userId}
          onChange={e => { setUserId(e.target.value); setSelectedLabel(''); }}
          placeholder="Or paste User ID..."
          className="w-48 bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
        />

        <button
          onClick={fetchGraph}
          disabled={loading || !userId.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Search size={16} />
          {loading ? 'Loading...' : 'Build Graph'}
        </button>
      </div>

      {graphData && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-6 mb-4 text-sm">
            <span className="text-gray-400">Nodes: <span className="text-white font-semibold">{graphData.stats?.totalNodes}</span></span>
            <span className="text-gray-400">Connections: <span className="text-white font-semibold">{graphData.stats?.totalEdges}</span></span>
            {/* Legend */}
            <div className="flex items-center gap-4 ml-auto">
              {Object.entries(NODE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-gray-500 text-xs capitalize">{type.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>

          {graphData.stats?.totalNodes === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No graph data found for this user ID. Make sure it's a valid MongoDB ObjectId.
            </div>
          ) : (
            <div className="overflow-auto">
              <div className="flex flex-wrap gap-3">
                {graphData.nodes?.map(n => (
                  <div
                    key={n.id}
                    className="border rounded-lg px-3 py-2 text-xs"
                    style={{ borderColor: NODE_COLORS[n.type] + '60', backgroundColor: NODE_COLORS[n.type] + '15' }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[n.type] }} />
                      <span className="text-gray-300 capitalize">{n.type?.replace('_', ' ')}</span>
                    </div>
                    <p className="font-mono text-gray-400">{n.id?.slice(0, 16)}...</p>
                    {n.label && <p className="text-gray-500 mt-0.5">{n.label}</p>}
                    {n.riskScore > 0 && (
                      <p style={{ color: NODE_COLORS[n.type] }}>Risk: {(n.riskScore * 100).toFixed(0)}%</p>
                    )}
                  </div>
                ))}
              </div>

              {graphData.edges?.length > 0 && (
                <div className="mt-5 border-t border-gray-800 pt-4">
                  <p className="text-gray-400 text-xs mb-2">Connections ({graphData.edges.length})</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {graphData.edges.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-mono">{e.source?.slice(0, 12)}</span>
                        <span className="px-2 py-0.5 bg-gray-800 rounded text-amber-400">{e.type?.replace('_', ' ')}</span>
                        <span className="font-mono">{e.target?.slice(0, 12)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!graphData && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center gap-3">
          <Network size={40} className="text-gray-700" />
          <p className="text-gray-500 text-sm">Select a user from the dropdown above to visualize their fraud graph</p>
        </div>
      )}
    </div>
  );
}

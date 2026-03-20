import { useSocket } from '../../context/SocketContext';
import RiskScoreBadge from '../transactions/RiskScoreBadge';
import { formatDistanceToNow } from 'date-fns';

export default function LiveAlertFeed() {
  const { alerts } = useSocket();
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Live Alerts</h3>
        <span className="flex items-center gap-1.5 text-xs text-green-400">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Live
        </span>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.length === 0 && <p className="text-gray-500 text-sm text-center py-6">No alerts yet — monitoring...</p>}
        {alerts.map(a => (
          <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
            <div>
              <p className="text-white text-xs font-mono">{a.transactionId?.slice(0,16)}...</p>
              <p className="text-gray-500 text-xs">{a.reason}</p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <RiskScoreBadge score={a.riskScore} level={a.riskLevel} />
              <span className="text-gray-600 text-xs">{a.timestamp ? formatDistanceToNow(new Date(a.timestamp), { addSuffix: true }) : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

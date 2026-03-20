import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions } from '../store/fraudSlice';
import RiskScoreBadge from '../components/transactions/RiskScoreBadge';
import { format } from 'date-fns';
import { Search, Filter } from 'lucide-react';

const STATUS_COLORS = { approved: 'text-green-400', blocked: 'text-red-400', flagged: 'text-amber-400', under_review: 'text-blue-400', pending: 'text-gray-400' };

export default function Transactions() {
  const dispatch = useDispatch();
  const { transactions, pagination, loading } = useSelector(s => s.fraud);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [riskLevel, setRiskLevel] = useState('');

  useEffect(() => { dispatch(fetchTransactions({ page, limit: 25, status: status || undefined, riskLevel: riskLevel || undefined })); }, [dispatch, page, status, riskLevel]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-white">Transactions</h1>
      <div className="flex gap-3 flex-wrap">
        <div className="relative"><Filter size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <select value={status} onChange={e => setStatus(e.target.value)} className="pl-8 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-red-500">
            <option value="">All statuses</option>
            {['approved','blocked','flagged','under_review','pending'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-red-500">
          <option value="">All risk levels</option>
          {['low','medium','high','critical'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-800">
            {['Transaction ID','User','Amount','Type','Status','Risk Score','Time'].map(h => (
              <th key={h} className="text-left text-gray-400 font-medium px-4 py-3 text-xs uppercase tracking-wide">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.transactionId} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-gray-300">{tx.transactionId?.slice(0,20)}...</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{tx.userId?.slice(0,12)}</td>
                <td className="px-4 py-3 text-white font-medium">${tx.amount?.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-400 capitalize">{tx.type}</td>
                <td className={`px-4 py-3 capitalize font-medium ${STATUS_COLORS[tx.status]}`}>{tx.status?.replace('_',' ')}</td>
                <td className="px-4 py-3"><RiskScoreBadge score={tx.riskScore} level={tx.riskLevel} /></td>
                <td className="px-4 py-3 text-gray-500 text-xs">{tx.createdAt ? format(new Date(tx.createdAt), 'MMM d, HH:mm') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!transactions.length && !loading && <p className="text-gray-500 text-center py-10">No transactions found</p>}
      </div>
      {pagination.pages > 1 && (
        <div className="flex items-center gap-2 justify-end">
          <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-700">Prev</button>
          <span className="text-gray-400 text-sm">Page {page} of {pagination.pages}</span>
          <button disabled={page === pagination.pages} onClick={() => setPage(p => p+1)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded text-sm disabled:opacity-40 hover:bg-gray-700">Next</button>
        </div>
      )}
    </div>
  );
}

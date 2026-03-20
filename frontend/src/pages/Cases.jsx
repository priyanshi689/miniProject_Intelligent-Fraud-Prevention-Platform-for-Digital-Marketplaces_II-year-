import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCases } from '../store/fraudSlice';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

const STATUS_ICON = { open: <Clock size={14} className="text-blue-400" />, investigating: <AlertTriangle size={14} className="text-amber-400" />, confirmed_fraud: <XCircle size={14} className="text-red-400" />, false_positive: <CheckCircle2 size={14} className="text-green-400" />, closed: <CheckCircle2 size={14} className="text-gray-400" /> };
const PRIORITY_COLORS = { critical: 'border-l-red-500', high: 'border-l-orange-500', medium: 'border-l-amber-500', low: 'border-l-blue-500' };

export default function Cases() {
  const dispatch = useDispatch();
  const { cases } = useSelector(s => s.fraud);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { dispatch(fetchCases({ status: statusFilter || undefined, limit: 30 })); }, [dispatch, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Fraud Cases</h1>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 text-sm focus:outline-none focus:border-red-500">
          <option value="">All statuses</option>
          {['open','investigating','confirmed_fraud','false_positive','closed'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
        </select>
      </div>
      <div className="grid gap-3">
        {cases.map(c => (
          <div key={c.caseId} className={`bg-gray-900 border border-gray-800 border-l-4 ${PRIORITY_COLORS[c.priority]} rounded-xl p-5`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {STATUS_ICON[c.status]}
                  <span className="text-white font-semibold">{c.title}</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{c.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>Type: <span className="text-gray-300">{c.type?.replace('_',' ')}</span></span>
                  <span>Users affected: <span className="text-gray-300">{c.affectedUsers?.length}</span></span>
                  <span>Total: <span className="text-amber-400">${c.totalAmount?.toLocaleString()}</span></span>
                  <span>Created: <span className="text-gray-300">{c.createdAt ? format(new Date(c.createdAt), 'MMM d, yyyy') : '-'}</span></span>
                </div>
              </div>
              <span className={`ml-4 px-2 py-1 rounded text-xs capitalize font-medium ${c.priority === 'critical' ? 'bg-red-900 text-red-300' : c.priority === 'high' ? 'bg-orange-900 text-orange-300' : 'bg-gray-800 text-gray-300'}`}>
                {c.priority}
              </span>
            </div>
          </div>
        ))}
        {!cases.length && <p className="text-gray-500 text-center py-10">No cases found</p>}
      </div>
    </div>
  );
}

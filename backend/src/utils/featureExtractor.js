const extractFeatures = (transaction, userHistory = []) => {
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  const last1h = userHistory.filter(t => (Date.now() - new Date(t.createdAt)) < 3600000);
  const last24h = userHistory.filter(t => (Date.now() - new Date(t.createdAt)) < 86400000);
  const last7d = userHistory.filter(t => (Date.now() - new Date(t.createdAt)) < 604800000);
  const avg24h = last24h.length ? last24h.reduce((s, t) => s + t.amount, 0) / last24h.length : 0;
  return {
    amount: transaction.amount,
    hour_of_day: hour,
    day_of_week: dayOfWeek,
    is_weekend: [0,6].includes(dayOfWeek) ? 1 : 0,
    is_night_hour: hour >= 0 && hour <= 5 ? 1 : 0,
    tx_count_1h: last1h.length,
    tx_count_24h: last24h.length,
    tx_count_7d: last7d.length,
    amount_vs_avg_24h: avg24h ? transaction.amount / avg24h : 1,
    is_new_device: transaction.isNewDevice ? 1 : 0,
    is_new_ip: transaction.isNewIp ? 1 : 0,
    payment_type_encoded: ['card','bank_transfer','wallet','crypto'].indexOf(transaction.paymentMethod),
    transaction_type_encoded: ['purchase','transfer','withdrawal','refund','payment'].indexOf(transaction.type),
  };
};
const getRiskLevel = (score) => score >= 0.8 ? 'critical' : score >= 0.6 ? 'high' : score >= 0.4 ? 'medium' : 'low';
module.exports = { extractFeatures, getRiskLevel };

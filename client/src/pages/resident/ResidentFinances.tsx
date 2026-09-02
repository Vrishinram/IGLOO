import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUnitStatus, payDues, getTreasurySummary, getTransactions } from '../../services/api';
import { Unit, TreasurySummary, TreasuryTransaction } from '../../types';
import { Wallet, Loader2, IndianRupee, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const ResidentFinances = () => {
  const { user } = useAuth();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const fetchData = async () => {
    try {
      const [unitRes, summaryRes, transRes] = await Promise.all([
        getUnitStatus(),
        getTreasurySummary(),
        getTransactions()
      ]);
      setUnit(unitRes.data.units.find(u => u.unitNumber === user?.unitNumber) || null);
      const s = summaryRes.data;
      setSummary({ totalBalance: s.totalBalance, monthlyInflow: s.currentMonthInflow, monthlyOutflow: s.currentMonthOutflow, currentMonthInflow: s.currentMonthInflow, currentMonthOutflow: s.currentMonthOutflow, categoryBreakdown: s.categoryBreakdown });
      setTransactions(transRes.data.transactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handlePay = async () => {
    if (!unit) return;
    setPayLoading(true);
    try {
      await payDues(unit.unitNumber, unit.monthlyMaintenanceFee);
      setPaySuccess(true);
      setTimeout(() => {
        setIsPayModalOpen(false);
        setPaySuccess(false);
        fetchData(); // Refresh data
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Payment failed");
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>;

  const breakdownEntries = summary?.categoryBreakdown
    ? Object.entries(summary.categoryBreakdown).map(([category, amount]: [string, number]) => ({ category, amount: Math.abs(amount) }))
    : [];
  const totalExpense = breakdownEntries.reduce((acc: number, curr) => acc + curr.amount, 0) || 1;
  const colors = ['bg-primary-600', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Finances</h1>
        <p className="text-slate-500 font-medium">Manage dues and view society treasury</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Dues Card */}
        <div className="card p-6 border border-emerald-200 bg-emerald-50 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" /> My Dues
              </h2>
              <p className="text-slate-600 font-bold text-sm mt-1">Flat {user?.unitNumber}</p>
            </div>
            {unit && (
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider badge-${unit.currentDueStatus.toLowerCase()}`}>
                {unit.currentDueStatus}
              </span>
            )}
          </div>

          <div className="mb-6">
            <p className="text-slate-600 font-bold text-sm mb-1">Monthly Maintenance</p>
            <h3 className="text-4xl font-black text-slate-900 flex items-center">
              <IndianRupee className="w-8 h-8" /> 
              {unit?.monthlyMaintenanceFee.toLocaleString()}
            </h3>
            {unit?.lastPaidDate && (
              <p className="text-xs text-slate-500 font-medium mt-2">Last paid: {new Date(unit.lastPaidDate).toLocaleDateString()}</p>
            )}
          </div>

          {unit?.currentDueStatus !== 'PAID' ? (
            <button 
              onClick={() => setIsPayModalOpen(true)}
              className="btn-primary w-full text-lg py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold"
            >
              Pay Dues (Simulated UPI)
            </button>
          ) : (
            <div className="w-full text-center py-3 bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 font-bold flex justify-center items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> All dues cleared
            </div>
          )}
        </div>

        {/* Society Treasury Summary */}
        <div className="card p-6 space-y-6 bg-white border-slate-200 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">Society Treasury Overview</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-600 font-bold mb-1">Reserve Balance</p>
              <p className="text-xl font-black text-slate-900">₹{summary?.totalBalance.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs text-emerald-700 font-bold mb-1">Monthly Inflow</p>
              <p className="text-xl font-black text-emerald-700">₹{summary?.monthlyInflow.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-slate-700 mb-3">Expense Breakdown (This Month)</p>
            <div className="space-y-3">
              {breakdownEntries.map((cat, i) => {
                const percent = Math.round((cat.amount / totalExpense) * 100);
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-bold">{cat.category}</span>
                      <span className="text-slate-700 font-extrabold">₹{cat.amount.toLocaleString()} ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={twMerge("h-full rounded-full", colors[i % colors.length])} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Society Transactions */}
      <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-extrabold text-slate-900">Recent Society Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Description</th>
                <th className="p-4 font-bold">Category</th>
                <th className="p-4 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map(t => (
                <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-600 font-medium">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-slate-900">
                    {t.description}
                    {t.vendorName && <span className="block text-xs text-slate-500 font-medium">{t.vendorName}</span>}
                    {t.unitNumber && <span className="block text-xs text-slate-500 font-medium">Unit: {t.unitNumber}</span>}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-bold text-xs">{t.category}</span>
                  </td>
                  <td className="p-4 text-right font-black">
                    {t.transactionType === 'INFLOW' ? (
                      <span className="text-emerald-600 flex items-center justify-end gap-1"><ArrowUpRight className="w-4 h-4"/> ₹{t.amount.toLocaleString()}</span>
                    ) : (
                      <span className="text-rose-600 flex items-center justify-end gap-1"><ArrowDownRight className="w-4 h-4"/> ₹{t.amount.toLocaleString()}</span>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No recent transactions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      {isPayModalOpen && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-content w-full max-w-sm p-6 text-center bg-white border border-slate-200 shadow-xl rounded-xl">
            {paySuccess ? (
              <div className="py-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-emerald-600 mb-2">Payment Successful!</h2>
                <p className="text-slate-600 font-medium">Thank you for clearing your dues.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-extrabold text-slate-900 mb-2">Simulate UPI Payment</h2>
                <p className="text-slate-600 font-bold text-sm mb-6">Pay ₹{unit?.monthlyMaintenanceFee.toLocaleString()} for Unit {unit?.unitNumber}</p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col items-center">
                  <div className="w-32 h-32 bg-slate-200 rounded-lg flex items-center justify-center mb-2">
                    <span className="text-slate-500 font-mono font-bold text-sm">[ QR Code ]</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Scan via any UPI App</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setIsPayModalOpen(false)} className="btn-secondary flex-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold" disabled={payLoading}>Cancel</button>
                  <button onClick={handlePay} disabled={payLoading} className="btn-primary flex-1 flex justify-center items-center bg-primary-600 text-white hover:bg-primary-700 font-bold">
                    {payLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Payment"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentFinances;

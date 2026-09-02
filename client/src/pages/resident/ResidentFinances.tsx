import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUnitStatus, payDues, getTreasurySummary, getTransactions, getUnitLedger } from '../../services/api';
import { Unit, TreasurySummary, TreasuryTransaction } from '../../types';
import { Wallet, Loader2, IndianRupee, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, AlertCircle, FileText, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const ResidentFinances = () => {
  const { user } = useAuth();
  const [unit, setUnit] = useState<Unit | null>(null);
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [ledger, setLedger] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Payment Modal
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedPayItem, setSelectedPayItem] = useState<any | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const fetchData = async () => {
    try {
      const [unitRes, summaryRes, transRes] = await Promise.all([
        getUnitStatus(),
        getTreasurySummary(),
        getTransactions()
      ]);
      const currentUnit = unitRes.data.units.find(u => u.unitNumber === user?.unitNumber) || null;
      setUnit(currentUnit);

      const s = summaryRes.data;
      setSummary({ 
        totalBalance: s.totalBalance, 
        monthlyInflow: s.currentMonthInflow, 
        monthlyOutflow: s.currentMonthOutflow, 
        currentMonthInflow: s.currentMonthInflow, 
        currentMonthOutflow: s.currentMonthOutflow, 
        categoryBreakdown: s.categoryBreakdown 
      });
      setTransactions(transRes.data.transactions);

      if (user?.unitNumber) {
        const ledgerRes = await getUnitLedger(user.unitNumber);
        setLedger(ledgerRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const openPayModal = (item?: any) => {
    setSelectedPayItem(item || null);
    setIsPayModalOpen(true);
  };

  const handlePay = async () => {
    if (!unit) return;
    setPayLoading(true);
    try {
      if (selectedPayItem && selectedPayItem.chargeId) {
        // Pay specific raised fund bill
        await payDues(unit.unitNumber, selectedPayItem.amount, selectedPayItem.chargeId, selectedPayItem.title);
      } else {
        // Pay full outstanding dues (or monthly maintenance)
        const payAmt = selectedPayItem ? selectedPayItem.amount : (ledger?.totalPendingAmount || unit.monthlyMaintenanceFee || 3500);
        await payDues(unit.unitNumber, payAmt);
      }
      setPaySuccess(true);
      setTimeout(() => {
        setIsPayModalOpen(false);
        setPaySuccess(false);
        setSelectedPayItem(null);
        fetchData(); // Refresh all data live
      }, 1800);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Payment failed");
    } finally {
      setPayLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>;

  const totalPending = ledger?.totalPendingAmount ?? (unit?.currentDueStatus !== 'PAID' ? (unit?.monthlyMaintenanceFee || 3500) : 0);
  const isPaid = totalPending === 0;

  const breakdownEntries = summary?.categoryBreakdown
    ? Object.entries(summary.categoryBreakdown).map(([category, amount]: [string, number]) => ({ category, amount: Math.abs(amount) }))
    : [];
  const totalExpense = breakdownEntries.reduce((acc: number, curr) => acc + curr.amount, 0) || 1;
  const colors = ['bg-primary-600', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Finances & Bills</h1>
        <p className="text-slate-500 font-medium">Manage maintenance dues, special funds, and view society treasury</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Dues Card */}
        <div className={`card p-6 border shadow-sm flex flex-col justify-between ${
          isPaid ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50'
        }`}>
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Wallet className={`w-5 h-5 ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`} /> My Dues & Levies
                </h2>
                <p className="text-slate-600 font-bold text-sm mt-1">Flat {user?.unitNumber} • {user?.name}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {isPaid ? 'ALL CLEARED' : 'DUES PENDING'}
              </span>
            </div>

            <div className="mb-6">
              <p className="text-slate-600 font-bold text-sm mb-1">Total Outstanding Due</p>
              <h3 className={`text-4xl font-black flex items-center ${isPaid ? 'text-emerald-700' : 'text-slate-900'}`}>
                <IndianRupee className="w-8 h-8" /> 
                {totalPending.toLocaleString()}
              </h3>
              {unit?.lastPaidDate && (
                <p className="text-xs text-slate-500 font-medium mt-2">
                  Last payment recorded: {new Date(unit.lastPaidDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {!isPaid ? (
            <button 
              onClick={() => openPayModal()}
              className="btn-primary w-full text-lg py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              Pay All Dues (₹{totalPending.toLocaleString()})
            </button>
          ) : (
            <div className="w-full text-center py-3 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200 font-bold flex justify-center items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> All dues cleared for this flat!
            </div>
          )}
        </div>

        {/* Society Treasury Summary */}
        <div className="card p-6 space-y-6 bg-white border-slate-200 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900">Society Treasury Overview</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs text-slate-600 font-bold mb-1">Reserve Balance</p>
              <p className="text-xl font-black text-slate-900">₹{summary?.totalBalance.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs text-emerald-700 font-bold mb-1">Monthly Inflow</p>
              <p className="text-xl font-black text-emerald-700">₹{summary?.monthlyInflow.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300">
              <p className="text-xs text-emerald-800 font-bold mb-1">Monthly Surplus</p>
              <p className="text-xl font-black text-emerald-800">
                +₹{summary ? Math.max(0, summary.monthlyInflow - summary.monthlyOutflow).toLocaleString() : '0'}
              </p>
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

      {/* Itemized Bills & Special Funds Raised */}
      <div className="card bg-white border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Itemized Bills & Special Funds
            </h2>
            <p className="text-xs text-slate-500 font-medium">Breakdown of regular maintenance and special society fund levies</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
            {ledger?.pendingItems?.length || 0} Pending
          </span>
        </div>

        {ledger?.pendingItems && ledger.pendingItems.length > 0 ? (
          <div className="space-y-3">
            {ledger.pendingItems.map((item: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl border-2 border-amber-200/80 bg-amber-50/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900">{item.title}</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-200 text-amber-900 rounded">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{item.description}</p>
                  <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Date: {new Date(item.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4 self-end md:self-center">
                  <span className="text-xl font-black text-amber-950">₹{item.amount.toLocaleString()}</span>
                  <button 
                    onClick={() => openPayModal(item)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg transition-colors shadow-xs flex items-center gap-1"
                  >
                    Pay This Bill <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-emerald-200 bg-emerald-50/60 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="font-extrabold text-emerald-900 text-base">No Pending Bills!</p>
            <p className="text-xs text-emerald-700 font-medium">You have cleared all maintenance dues and special fund levies.</p>
          </div>
        )}
      </div>

      {/* Flat Payment History & Receipts */}
      <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              My Payment Receipts & History
            </h2>
            <p className="text-xs text-slate-500 font-medium">Receipts recorded for Flat {user?.unitNumber}</p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {ledger?.payments?.length || 0} Receipts
          </span>
        </div>
        <div className="overflow-x-auto">
          {ledger?.payments && ledger.payments.length > 0 ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-bold">Date</th>
                  <th className="p-3 font-bold">Bill Description</th>
                  <th className="p-3 font-bold">Category</th>
                  <th className="p-3 font-bold text-right">Amount Paid</th>
                  <th className="p-3 font-bold text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledger.payments.map((p: any) => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-slate-600 font-medium">{new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-slate-900">{p.description}</td>
                    <td className="p-3 text-slate-500 font-medium text-xs">{p.category}</td>
                    <td className="p-3 text-right font-black text-emerald-600">+₹{p.amount.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-center text-slate-400 font-medium text-sm">No payment history yet on record.</p>
          )}
        </div>
      </div>

      {/* Pay Modal (Simulated UPI) */}
      {isPayModalOpen && (
        <div className="modal-overlay flex items-center justify-center p-4 z-50">
          <div className="modal-content w-full max-w-md p-6 text-center bg-white border border-slate-200 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200">
            {paySuccess ? (
              <div className="py-8 flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
                  <Check className="w-10 h-10 text-white stroke-[3]" />
                </div>
                <h2 className="text-2xl font-black text-emerald-700 mb-2">Payment Successful!</h2>
                <p className="text-slate-600 font-medium text-sm">
                  Dues for Flat {unit?.unitNumber} have been cleared and credited to the society treasury.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-black text-slate-900 mb-1">Simulate UPI Payment</h2>
                <p className="text-slate-500 font-medium text-xs mb-4">Silver Oak Heights Co-operative Housing Society</p>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left mb-5 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Payable For:</span>
                    <span className="font-bold text-slate-800">{selectedPayItem?.title || 'Outstanding Dues'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>Flat Number:</span>
                    <span className="font-bold text-slate-800">Flat {unit?.unitNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span className="text-emerald-700 text-lg">
                      ₹{(selectedPayItem?.amount || totalPending).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col items-center">
                  <div className="w-32 h-32 bg-slate-200 rounded-lg flex items-center justify-center mb-2 font-mono font-bold text-xs text-slate-500 border border-slate-300">
                    [ UPI QR CODE ]
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Scan with GPay / PhonePe / Paytm / BHIM</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => { setIsPayModalOpen(false); setSelectedPayItem(null); }} 
                    className="btn-secondary flex-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold" 
                    disabled={payLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handlePay} 
                    disabled={payLoading} 
                    className="btn-primary flex-1 flex justify-center items-center bg-primary-600 text-white hover:bg-primary-700 font-bold"
                  >
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

import React, { useState, useEffect } from 'react';
import { getTreasurySummary, getTransactions, createTransaction, getUnitStatus, auditFinances, getUnitLedger, payDues } from '../../services/api';
import { TreasurySummary, TreasuryTransaction, Unit } from '../../types';
import { Wallet, TrendingUp, TrendingDown, Sparkles, Plus, Loader2, ArrowUpRight, ArrowDownRight, User, Phone, Mail, CheckCircle2, Clock, AlertCircle, FileText, ArrowRight, Check, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AdminTreasury = () => {
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Audit State
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  // Expense Form State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('REPAIRS');
  const [expDesc, setExpDesc] = useState('');
  const [expVendor, setExpVendor] = useState('');
  const [expLoading, setExpLoading] = useState(false);

  // Raise Fund State
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [fundTarget, setFundTarget] = useState('ALL');
  const [fundAmount, setFundAmount] = useState('');
  const [fundDesc, setFundDesc] = useState('');
  const [fundLoading, setFundLoading] = useState(false);

  // Unit Ledger & Detail Modal State
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [unitDetails, setUnitDetails] = useState<any | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  const fetchData = async () => {
    try {
      const [sumRes, transRes, unitRes] = await Promise.all([
        getTreasurySummary(),
        getTransactions(),
        getUnitStatus()
      ]);
      const s = sumRes.data;
      setSummary({ totalBalance: s.totalBalance, monthlyInflow: s.currentMonthInflow, monthlyOutflow: s.currentMonthOutflow, currentMonthInflow: s.currentMonthInflow, currentMonthOutflow: s.currentMonthOutflow, categoryBreakdown: s.categoryBreakdown });
      setTransactions(transRes.data.transactions);
      setUnits(unitRes.data.units);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setExpLoading(true);
    try {
      await createTransaction({
        transactionType: 'OUTFLOW',
        amount: Number(expAmount),
        category: expCategory,
        description: expDesc,
        vendorName: expVendor
      });
      setIsExpenseModalOpen(false);
      setExpAmount(''); setExpDesc(''); setExpVendor('');
      fetchData();
      alert('Expense recorded successfully!');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Failed to record expense');
    } finally {
      setExpLoading(false);
    }
  };

  const handleAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await auditFinances();
      const audit = res.data.audit;
      setAuditResult(audit);

      // Generate PDF
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('IGLOO Society Audit Report', 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
      doc.text(`Total Reserve Balance: INR ${summary?.totalBalance}`, 14, 40);
      
      doc.setFontSize(14);
      doc.text('AI Analysis Summary', 14, 52);
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(audit, 180);
      doc.text(splitText, 14, 60);

      const nextY = 60 + (splitText.length * 5) + 10;
      doc.setFontSize(14);
      doc.text('Unit Fee Compliance', 14, nextY);

      const tableData = units.map(u => [
        u.unitNumber, 
        u.ownerName, 
        u.monthlyMaintenanceFee.toString(), 
        u.currentDueStatus
      ]);

      autoTable(doc, {
        startY: nextY + 5,
        head: [['Unit', 'Owner', 'Monthly Fee', 'Status']],
        body: tableData,
      });

      doc.save('IGLOO_Audit_Report.pdf');

    } catch (err) {
      console.error(err);
      alert('Audit failed');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleRaiseFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setFundLoading(true);
    try {
      const { raiseFund } = await import('../../services/api');
      await raiseFund({ targetType: fundTarget, amount: Number(fundAmount), description: fundDesc });
      setIsFundModalOpen(false);
      setFundAmount(''); setFundDesc('');
      alert('Funds raised successfully!');
      fetchData();
    } catch(err) {
      console.error(err);
      alert('Failed to raise fund');
    } finally {
      setFundLoading(false);
    }
  };

  const handleUnitClick = async (unitNumber: string) => {
    setSelectedUnit(unitNumber);
    setLedgerLoading(true);
    setUnitDetails(null);
    try {
      const res = await getUnitLedger(unitNumber);
      setUnitDetails(res.data);
    } catch(err) {
      console.error(err);
      alert('Failed to load unit fee details');
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleMarkPaid = async (unitNumber: string, amount: number) => {
    if (!confirm(`Confirm marking ₹${amount.toLocaleString()} dues for Unit ${unitNumber} as PAID? This will record an inflow transaction in the society treasury.`)) return;
    setMarkingPaid(true);
    try {
      const { payDues } = await import('../../services/api');
      await payDues(unitNumber, amount);
      alert(`Dues for Unit ${unitNumber} marked as PAID!`);
      await fetchData();
      const res = await getUnitLedger(unitNumber);
      setUnitDetails(res.data);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Failed to update payment');
    } finally {
      setMarkingPaid(false);
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" /></div>;

  const chartData = summary?.categoryBreakdown
    ? Object.entries(summary.categoryBreakdown).map(([category, amount]: [string, number]) => ({
        name: category,
        amount: Math.abs(amount),
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Society Treasury</h1>
          <p className="text-slate-500 font-medium">Manage finances, dues, and expenses</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => setIsFundModalOpen(true)} className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none font-bold shadow-sm">
            <TrendingUp className="w-4 h-4" /> Raise Fund
          </button>
          <button onClick={handleAudit} className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-2 flex-1 md:flex-none font-bold shadow-sm">
            {auditLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Run AI Audit
          </button>
          <button onClick={() => setIsExpenseModalOpen(true)} className="btn-primary flex items-center justify-center gap-2 flex-1 md:flex-none bg-primary-600 hover:bg-primary-700 text-white shadow-sm font-bold">
            <Plus className="w-4 h-4" /> Log Expense
          </button>
        </div>
      </div>

      {/* AI Audit Result Card */}
      {auditResult && (
        <div className="card p-6 border-purple-200 bg-white shadow-sm relative">
          <button onClick={() => setAuditResult(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">✕</button>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-extrabold text-slate-900">AI Financial Audit Report</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">Executive Summary</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{auditResult.summary}</p>
              </div>
              <div className="flex gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex-1">
                  <p className="text-xs text-slate-500 font-bold">Health Score</p>
                  <p className="text-2xl font-black text-emerald-600">{auditResult.healthScore}/100</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex-1">
                  <p className="text-xs text-slate-500 font-bold">Risk Level</p>
                  <p className={`text-xl font-black ${auditResult.riskLevel === 'LOW' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {auditResult.riskLevel}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-2">Recommendations</h3>
              <ul className="space-y-2">
                {auditResult.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2 font-medium">
                    <span className="text-purple-600 font-bold">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 4 Main Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6 bg-white border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg"><Wallet className="w-5 h-5 text-blue-600" /></div>
            <p className="text-slate-600 font-bold">Reserve Balance</p>
          </div>
          <h3 className="text-3xl font-black text-slate-900">₹{summary?.totalBalance.toLocaleString()}</h3>
        </div>
        <div className="card p-6 bg-emerald-50 border-emerald-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600" /></div>
            <p className="text-emerald-700 font-bold">Monthly Inflow</p>
          </div>
          <h3 className="text-3xl font-black text-emerald-700">₹{summary?.monthlyInflow.toLocaleString()}</h3>
        </div>
        <div className="card p-6 bg-rose-50 border-rose-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-100 rounded-lg"><TrendingDown className="w-5 h-5 text-rose-600" /></div>
            <p className="text-rose-700 font-bold">Monthly Outflow</p>
          </div>
          <h3 className="text-3xl font-black text-rose-700">₹{summary?.monthlyOutflow.toLocaleString()}</h3>
        </div>
        <div className="card p-6 bg-emerald-50 border-emerald-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-200/60 rounded-lg"><ArrowUpRight className="w-5 h-5 text-emerald-800" /></div>
            <p className="text-emerald-800 font-bold">Monthly Net Profit</p>
          </div>
          <h3 className="text-3xl font-black text-emerald-800">
            +₹{summary ? Math.max(0, summary.monthlyInflow - summary.monthlyOutflow).toLocaleString() : '0'}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="card p-6 bg-white border-slate-200 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 mb-6">Expense Breakdown</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(val) => `₹${val/1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={80} />
                <Tooltip 
                  formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#06b6d4'][index % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dues Compliance */}
        <div className="card p-0 flex flex-col overflow-hidden bg-white border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Unit Fee Compliance</h2>
              <p className="text-xs text-slate-500 font-medium">Click any row to inspect itemized dues & payment history</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
              {units.filter(u => u.currentDueStatus !== 'PAID').length} Pending
            </span>
          </div>
          <div className="overflow-y-auto max-h-[320px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-3 font-bold">Unit</th>
                  <th className="p-3 font-bold">Resident / Owner</th>
                  <th className="p-3 font-bold">Pending Due</th>
                  <th className="p-3 font-bold text-center">Status</th>
                  <th className="p-3 font-bold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map(u => {
                  const isPending = u.currentDueStatus !== 'PAID';
                  const pendingFee = isPending ? (u.monthlyMaintenanceFee || 3500) : 0;
                  return (
                    <tr 
                      key={u._id} 
                      className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      onClick={() => handleUnitClick(u.unitNumber)}
                    >
                      <td className="p-3 font-extrabold text-slate-900 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        {u.unitNumber}
                      </td>
                      <td className="p-3 text-sm text-slate-700 font-medium">{u.ownerName}</td>
                      <td className="p-3 font-bold">
                        {isPending ? (
                          <span className="text-amber-800 font-extrabold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ₹{pendingFee.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">₹0 (Paid)</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                          u.currentDueStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          u.currentDueStatus === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {u.currentDueStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-xs font-bold text-primary-600 group-hover:text-primary-700 inline-flex items-center gap-1">
                          View <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-content w-full max-w-md p-6 bg-white border border-slate-200 shadow-xl rounded-xl">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Log Society Expense</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Amount (₹)</label>
                <input required type="number" min="1" className="input-field w-full bg-slate-50 border-slate-200 text-slate-900" value={expAmount} onChange={e => setExpAmount(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                <select required className="select-field w-full bg-slate-50 border-slate-200 text-slate-900" value={expCategory} onChange={e => setExpCategory(e.target.value)}>
                  <option value="REPAIRS">Repairs</option>
                  <option value="SECURITY">Security / Salary</option>
                  <option value="WATER">Water</option>
                  <option value="ELECTRICITY">Electricity</option>
                  <option value="EVENTS">Events</option>
                  <option value="GARDENING">Gardening</option>
                  <option value="MISC">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <input required type="text" className="input-field w-full bg-slate-50 border-slate-200 text-slate-900" placeholder="e.g. Lift AMC payment" value={expDesc} onChange={e => setExpDesc(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Vendor/Payee (Optional)</label>
                <input type="text" className="input-field w-full bg-slate-50 border-slate-200 text-slate-900" placeholder="e.g. Otis Elevators" value={expVendor} onChange={e => setExpVendor(e.target.value)} />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn-secondary flex-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold">Cancel</button>
                <button type="submit" disabled={expLoading} className="btn-danger flex-1 flex justify-center items-center gap-2 font-bold">
                  {expLoading && <Loader2 className="w-4 h-4 animate-spin" />} Record Outflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isFundModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 bg-amber-50">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" /> Raise Fund
              </h2>
              <p className="text-sm text-amber-700 mt-1">Bill targeted flats for specific expenses.</p>
            </div>
            <form onSubmit={handleRaiseFund} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target</label>
                <select required value={fundTarget} onChange={e => setFundTarget(e.target.value)} className="w-full border-slate-200 rounded-lg bg-slate-50 font-medium">
                  <option value="ALL">All Residents</option>
                  <option value="OWNER">Owners Only</option>
                  <option value="TENANT">Tenants Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Amount (INR)</label>
                <input type="number" required value={fundAmount} onChange={e => setFundAmount(e.target.value)} className="w-full border-slate-200 rounded-lg bg-slate-50 font-medium" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <input type="text" required value={fundDesc} onChange={e => setFundDesc(e.target.value)} placeholder="e.g. Festival Decor Fund" className="w-full border-slate-200 rounded-lg bg-slate-50 font-medium" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setIsFundModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={fundLoading} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg flex items-center gap-2">
                  {fundLoading && <Loader2 className="w-4 h-4 animate-spin" />} Issue Bills
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unit Fee Details Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-black text-xl border border-primary-200">
                  {selectedUnit}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">Flat {selectedUnit}</h2>
                    {unitDetails?.unit?.currentDueStatus && (
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        unitDetails.unit.currentDueStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : unitDetails.unit.currentDueStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {unitDetails.unit.currentDueStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 font-medium text-xs mt-0.5">
                    Block {unitDetails?.unit?.block || selectedUnit.split('-')[0]} • Silver Oak Heights
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedUnit(null); setUnitDetails(null); }} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              {ledgerLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-sm">Loading flat financial records...</p>
                </div>
              ) : (
                <>
                  {/* Resident Info Card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resident / Owner</p>
                      <p className="text-base font-extrabold text-slate-900 flex items-center gap-1.5">
                        <User className="w-4 h-4 text-slate-500" />
                        {unitDetails?.resident?.name || unitDetails?.unit?.ownerName || 'Unknown Resident'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {unitDetails?.resident?.phone || 'No phone recorded'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {unitDetails?.resident?.email || 'No email recorded'}
                      </p>
                    </div>
                    <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fee & Ledger Terms</p>
                      <p className="text-sm font-bold text-slate-800">
                        Monthly Maintenance: <span className="font-extrabold text-slate-900">₹{(unitDetails?.unit?.monthlyMaintenanceFee || 3500).toLocaleString()}</span>
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Resident Type: <span className="font-bold text-slate-700">{unitDetails?.resident?.residentType || 'OWNER'}</span>
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        Last Payment: <span className="font-bold text-slate-700">
                          {unitDetails?.unit?.lastPaidDate ? new Date(unitDetails.unit.lastPaidDate).toLocaleDateString() : 'No payment recorded yet'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* What is Pending? (Itemized Breakdown) */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Pending Dues Breakdown
                      </h3>
                      {unitDetails?.totalPendingAmount > 0 ? (
                        <span className="text-sm font-black text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                          Total Due: ₹{unitDetails.totalPendingAmount.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> All Cleared
                        </span>
                      )}
                    </div>

                    {unitDetails?.pendingItems && unitDetails.pendingItems.length > 0 ? (
                      <div className="space-y-2.5">
                        {unitDetails.pendingItems.map((item: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl border-2 border-amber-200/80 bg-amber-50/40 flex justify-between items-center gap-4">
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm">{item.title}</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{item.description}</p>
                              <p className="text-[11px] text-amber-800 font-bold mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Due Date: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '10th of current month'}
                              </p>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <p className="text-lg font-black text-amber-900">₹{item.amount.toLocaleString()}</p>
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-200 text-amber-900 rounded">
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 text-center">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                        <p className="font-bold text-emerald-800 text-sm">No Pending Dues!</p>
                        <p className="text-xs text-emerald-600 font-medium">This flat has cleared all monthly maintenance and society charges.</p>
                      </div>
                    )}
                  </div>

                  {/* Payment History / Receipts */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      Recorded Payments & Receipts
                    </h3>
                    {unitDetails?.payments && unitDetails.payments.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="p-2.5 font-bold">Date</th>
                              <th className="p-2.5 font-bold">Description</th>
                              <th className="p-2.5 font-bold">Category</th>
                              <th className="p-2.5 font-bold text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {unitDetails.payments.map((p: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2.5 text-slate-600 font-medium">{new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                                <td className="p-2.5 font-bold text-slate-800">{p.description}</td>
                                <td className="p-2.5 text-slate-500 font-medium">{p.category}</td>
                                <td className="p-2.5 text-right font-extrabold text-emerald-600">+₹{p.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium py-2">No prior payment receipts on record for this unit.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
              <div>
                {unitDetails?.unit?.currentDueStatus !== 'PAID' && (
                  <button 
                    onClick={() => handleMarkPaid(selectedUnit, unitDetails?.totalPendingAmount || 3500)}
                    disabled={markingPaid || ledgerLoading}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {markingPaid ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Mark Dues as Paid (Record Inflow)
                  </button>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => { setSelectedUnit(null); setUnitDetails(null); }} 
                className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm rounded-xl transition-colors shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTreasury;

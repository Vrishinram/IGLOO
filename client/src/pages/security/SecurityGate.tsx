import React, { useState, useRef } from 'react';
import { verifyVisitorCode, checkInVisitor, checkOutVisitor } from '../../services/api';
import { VisitorPass } from '../../types';
import { Shield, Search, Loader2, CheckCircle2, XCircle, ArrowRight, UserPlus, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

const SecurityGate = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisitorPass | null>(null);
  const [error, setError] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!code || code.length < 3) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const res = await verifyVisitorCode(code.trim().toUpperCase());
      if (res.data.pass) {
        setResult(res.data.pass);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Pass not found or invalid');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!result) return;
    setCheckInLoading(true);
    try {
      await checkInVisitor(result._id);
      setResult({ ...result, status: 'INSIDE', checkInTime: new Date().toISOString() });
      setTimeout(() => {
        setResult(null);
        setCode('');
        inputRef.current?.focus();
      }, 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to check in');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!result) return;
    setCheckOutLoading(true);
    try {
      await checkOutVisitor(result._id);
      setResult({ ...result, status: 'COMPLETED', checkOutTime: new Date().toISOString() });
      setTimeout(() => {
        setResult(null);
        setCode('');
        inputRef.current?.focus();
      }, 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to check out');
    } finally {
      setCheckOutLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 md:pt-10">
      <div className="text-center space-y-2 mb-8">
        <Shield className="w-16 h-16 text-amber-500 mx-auto" />
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gate Terminal</h1>
        <p className="text-slate-500 font-medium">Verify and check-in visitors</p>
      </div>

      <form onSubmit={handleVerify} className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-400" />
        <input 
          ref={inputRef}
          type="text" 
          autoFocus
          placeholder="Enter 6-digit Pass Code..." 
          className="w-full bg-white border-2 border-slate-200 text-slate-900 text-3xl md:text-4xl py-6 pl-20 pr-48 rounded-2xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 focus:outline-none uppercase tracking-widest font-mono shadow-sm"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button 
          type="submit"
          disabled={loading || !code}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black px-8 py-4 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Verify'}
        </button>
      </form>

      {/* Result Section */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300 shadow-sm">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-red-700 mb-2">NO MATCH FOUND ❌</h2>
          <p className="text-slate-600 font-medium text-lg">The pass code {code.toUpperCase()} is invalid or expired.</p>
          <button onClick={() => {setError(''); setCode(''); inputRef.current?.focus();}} className="mt-6 px-6 py-2 bg-white border border-slate-200 font-bold text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm">Clear</button>
        </div>
      )}

      {result && (
        <div className={`rounded-2xl p-8 text-center border-2 animate-in fade-in slide-in-from-bottom-8 duration-300 shadow-sm ${
          result.status === 'PRE_APPROVED' ? 'bg-emerald-50 border-emerald-200' :
          result.status === 'INSIDE' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
        }`}>
          {result.status === 'PRE_APPROVED' && (
            <>
              <CheckCircle2 className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
              <h2 className="text-3xl font-black text-emerald-700 mb-6">VALID PASS ✅</h2>
            </>
          )}

          <div className="bg-white rounded-xl p-6 mb-6 text-left space-y-4 inline-block min-w-[300px] border border-slate-200 shadow-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Host Flat</span>
              <span className="text-2xl font-black text-slate-900">{result.unitNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Visitor Name</span>
              <span className="text-lg font-bold text-slate-900">{result.visitorName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Purpose</span>
              <span className="text-lg font-bold text-slate-900">{result.purpose}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-slate-500 font-medium">Expected Date</span>
              <span className="text-lg font-bold text-slate-900">{new Date(result.expectedDate).toLocaleDateString()}</span>
            </div>
          </div>

          {result.status === 'PRE_APPROVED' && (
            <button 
              onClick={handleCheckIn}
              disabled={checkInLoading}
              className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-black rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-3 shadow-md"
            >
              {checkInLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : '✅ ALLOW ENTRY (CHECK IN)'}
            </button>
          )}

          {result.status === 'INSIDE' && (
            <div className="space-y-4">
              <div className="py-3 px-4 bg-amber-100 text-amber-900 font-bold rounded-xl flex items-center justify-between border border-amber-200">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                  Visitor Inside Campus:
                </span>
                <span className="font-extrabold text-amber-950">
                  Entered at {result.checkInTime ? new Date(result.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier'}
                </span>
              </div>
              <button 
                onClick={handleCheckOut}
                disabled={checkOutLoading}
                className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white text-xl font-black rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex justify-center items-center gap-3 shadow-md"
              >
                {checkOutLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : <>🚪 ALLOW EXIT (CHECK OUT)</>}
              </button>
            </div>
          )}

          {result.status === 'COMPLETED' && (
            <div className="py-6 bg-slate-100 text-slate-800 font-extrabold rounded-xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="text-2xl font-black text-slate-900">VISITOR CHECKED OUT ✅</p>
              <p className="text-sm font-medium text-slate-500">
                Exit recorded at {result.checkOutTime ? new Date(result.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Walk-in Link */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-4 text-slate-400 font-bold">
          <span className="h-px w-12 bg-slate-200"></span>
          <span>OR</span>
          <span className="h-px w-12 bg-slate-200"></span>
        </div>
        <div className="mt-6">
          <Link to="/security/walk-in" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors shadow-sm">
            <UserPlus className="w-5 h-5" /> Register Walk-in Visitor <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SecurityGate;

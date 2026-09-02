import React, { useState, useEffect, useRef } from 'react';
import { verifyVisitorCode, checkInVisitor, checkOutVisitor, getVisitorPasses } from '../../services/api';
import { VisitorPass } from '../../types';
import { Shield, Search, Loader2, CheckCircle2, XCircle, ArrowRight, UserPlus, LogOut, Calendar, Clock, User, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const SecurityGate = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisitorPass | null>(null);
  const [error, setError] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);

  // Expected Visitors List
  const [expectedPasses, setExpectedPasses] = useState<VisitorPass[]>([]);
  const [expectedLoading, setExpectedLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadExpectedPasses();
  }, []);

  const loadExpectedPasses = async () => {
    setExpectedLoading(true);
    try {
      const res = await getVisitorPasses();
      const preApproved = (res.data.passes || []).filter(p => p.status === 'PRE_APPROVED');
      setExpectedPasses(preApproved);
    } catch (err) {
      console.error('Failed to load expected visitor passes', err);
    } finally {
      setExpectedLoading(false);
    }
  };

  const handleVerify = async (e?: React.FormEvent, customQuery?: string) => {
    e?.preventDefault();
    const queryTerm = (customQuery || code).trim();
    if (!queryTerm || queryTerm.length < 2) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const res = await verifyVisitorCode(queryTerm);
      if (res.data.pass) {
        setResult(res.data.pass);
        setCode(res.data.pass.passCode);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Pass not found for "${queryTerm}". Check the code or phone.`);
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
      await loadExpectedPasses();
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
      await loadExpectedPasses();
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
        <p className="text-slate-500 font-medium">Verify visitor pass & manage entry/exit</p>
      </div>

      {/* Search Form */}
      <div>
        <form onSubmit={(e) => handleVerify(e)} className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-slate-400" />
          <input 
            ref={inputRef}
            type="text" 
            autoFocus
            placeholder="Pass code, Phone, or Flat (e.g. 7824, IG-7824, A-102)..." 
            className="w-full bg-white border-2 border-slate-200 text-slate-900 text-xl md:text-2xl py-5 pl-20 pr-40 rounded-2xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 focus:outline-none uppercase tracking-wider font-mono shadow-sm"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button 
            type="submit"
            disabled={loading || !code}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-black px-6 py-3.5 rounded-xl transition-colors disabled:opacity-50 shadow-sm flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
          </button>
        </form>
        <p className="text-xs text-slate-400 font-medium mt-2 pl-2">
          💡 Fast Search: Enter 4-digit number (e.g. 7824), full pass code (IG-7824), visitor phone, or flat number.
        </p>
      </div>

      {/* Result Section */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300 shadow-sm">
          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-red-700 mb-2">NO MATCH FOUND ❌</h2>
          <p className="text-slate-600 font-medium text-lg">{error}</p>
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

          <div className="bg-white rounded-xl p-6 mb-6 text-left space-y-4 inline-block min-w-[320px] w-full max-w-md border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Pass Code</span>
              <span className="text-xl font-black text-primary-600 font-mono">{result.passCode}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Host Flat</span>
              <span className="text-2xl font-black text-slate-900">Flat {result.unitNumber}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Visitor Name</span>
              <span className="text-lg font-bold text-slate-900">{result.visitorName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Visitor Phone</span>
              <span className="text-base font-bold text-slate-700">{result.visitorPhone || 'Not provided'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <span className="text-slate-500 font-medium">Purpose</span>
              <span className="text-base font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">{result.purpose}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-slate-500 font-medium">Expected Date</span>
              <span className="text-sm font-bold text-slate-900">{new Date(result.expectedDate).toLocaleDateString()}</span>
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

      {/* Pre-Approved Expected Visitors List (One-Tap Verify) */}
      {!result && (
        <div className="card p-5 bg-white border-slate-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-black text-slate-900">Pre-Approved Expected Visitors</h2>
              <p className="text-xs text-slate-500 font-medium">Passes created by residents waiting for gate entry</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              {expectedPasses.length} Active
            </span>
          </div>

          {expectedLoading ? (
            <div className="py-6 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-1" />
              <p className="text-xs">Loading passes...</p>
            </div>
          ) : expectedPasses.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-sm font-medium">
              No pre-approved visitor passes waiting right now.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {expectedPasses.map((p) => (
                <div key={p._id} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg px-2 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xs text-primary-700 bg-primary-50 px-2 py-0.5 rounded border border-primary-200">
                        {p.passCode}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">{p.visitorName}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {p.purpose}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Visiting Flat <strong className="text-slate-800">{p.unitNumber}</strong></span>
                      {p.visitorPhone && <span>• 📞 {p.visitorPhone}</span>}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleVerify(undefined, p.passCode)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black rounded-lg transition-colors shadow-xs flex items-center gap-1 shrink-0"
                  >
                    Verify Pass <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Walk-in Link */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-4 text-slate-400 font-bold">
          <span className="h-px w-12 bg-slate-200"></span>
          <span>OR</span>
          <span className="h-px w-12 bg-slate-200"></span>
        </div>
        <div className="mt-4">
          <Link to="/security/walk-in" className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors shadow-sm">
            <UserPlus className="w-5 h-5 text-amber-500" /> Register Walk-in Visitor <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SecurityGate;

import React, { useState, useEffect } from 'react';
import { getVisitorPasses, checkOutVisitor } from '../../services/api';
import { VisitorPass } from '../../types';
import { ClipboardList, LogOut, Loader2 } from 'lucide-react';

const SecurityLiveLog = () => {
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [activeSOS, setActiveSOS] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [passesRes, sosRes] = await Promise.all([
        getVisitorPasses(),
        import('../../services/api').then(m => m.getActiveSOS())
      ]);
      setPasses(passesRes.data.passes);
      setActiveSOS(sosRes.data.alerts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // refresh every 5s for fast SOS detection
    return () => clearInterval(interval);
  }, []);

  const handleCheckOut = async (id: string) => {
    try {
      await checkOutVisitor(id);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to check out');
    }
  };

  const handleResolveSOS = async (id: string) => {
    try {
      const { resolveSOS } = await import('../../services/api');
      await resolveSOS(id);
      fetchData();
    } catch(e) {
      alert('Failed to resolve SOS');
    }
  };

  const inside = passes.filter(p => p.status === 'INSIDE');
  const completedToday = passes.filter(p => p.status === 'COMPLETED' && new Date(p.checkOutTime!).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-100 rounded-xl">
          <ClipboardList className="w-8 h-8 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Live Visitor Log</h1>
          <p className="text-slate-500 font-medium">Currently Inside: <span className="text-slate-900 font-bold">{inside.length}</span></p>
        </div>
      </div>

      {activeSOS.length > 0 && (
        <div className="space-y-4">
          {activeSOS.map(sos => (
            <div key={sos._id} className="bg-red-600 animate-pulse rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-red-400 text-white">
              <div className="text-center md:text-left">
                <h2 className="text-4xl font-black mb-1">🚨 EMERGENCY SOS 🚨</h2>
                <p className="text-xl font-bold">Flat: <span className="bg-white text-red-600 px-3 py-1 rounded-md ml-2">{sos.unitNumber}</span></p>
                <p className="text-red-100 mt-2 font-medium">Reported by: {sos.reportedBy?.name} | {sos.reportedBy?.phone}</p>
                <p className="text-red-200 text-sm mt-1">{new Date(sos.createdAt).toLocaleTimeString()}</p>
              </div>
              <button 
                onClick={() => handleResolveSOS(sos._id)}
                className="bg-white hover:bg-slate-100 text-red-600 px-8 py-4 rounded-xl font-black text-xl shadow-lg transition-transform active:scale-95"
              >
                Mark Resolved
              </button>
            </div>
          ))}
        </div>
      )}

      {loading && inside.length === 0 ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>
      ) : (
        <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-extrabold text-slate-900">Active Visitors (Inside Campus)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4 font-bold">Visitor</th>
                  <th className="p-4 font-bold">Flat</th>
                  <th className="p-4 font-bold">Purpose</th>
                  <th className="p-4 font-bold">Check-In</th>
                  <th className="p-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inside.map(pass => (
                  <tr key={pass._id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-extrabold text-slate-900">{pass.visitorName}</p>
                      <p className="text-xs text-slate-500 font-medium">{pass.visitorPhone}</p>
                    </td>
                    <td className="p-4 text-slate-700 font-bold">{pass.unitNumber}</td>
                    <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 font-bold">{pass.purpose}</span></td>
                    <td className="p-4 text-emerald-600 font-bold">
                      {pass.checkInTime ? new Date(pass.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleCheckOut(pass._id)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        Check Out <LogOut className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {inside.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No visitors currently inside.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Completed Today */}
      <div className="mt-8">
        <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider mb-4">Completed Today</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedToday.slice(0, 6).map(pass => (
            <div key={pass._id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
              <div>
                <p className="font-bold text-slate-700 text-sm">{pass.visitorName}</p>
                <p className="text-xs text-slate-500 font-medium">Flat {pass.unitNumber} • {pass.purpose}</p>
              </div>
              <div className="text-right text-xs font-medium">
                <p className="text-slate-500">In: {new Date(pass.checkInTime!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                <p className="text-slate-600 font-bold">Out: {new Date(pass.checkOutTime!).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityLiveLog;

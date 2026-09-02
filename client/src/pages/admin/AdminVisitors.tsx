import React, { useState, useEffect } from 'react';
import { getVisitorPasses } from '../../services/api';
import { VisitorPass } from '../../types';
import { Users, Loader2, RefreshCw, Clock } from 'lucide-react';

const AdminVisitors = () => {
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPasses = async () => {
    try {
      const res = await getVisitorPasses();
      setPasses(res.data.passes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPasses();
    // Optional polling for live monitor
    const interval = setInterval(() => {
      fetchPasses();
    }, 30000); // 30s
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPasses();
  };

  const insideCampus = passes.filter(p => p.status === 'INSIDE');
  const expectedToday = passes.filter(p => 
    p.status === 'PRE_APPROVED' && 
    new Date(p.expectedDate).toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Live Visitor Monitor</h1>
          <p className="text-slate-500 font-medium">Campus security overview</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6 bg-white border-emerald-200 flex items-center gap-6 shadow-sm">
          <div className="p-4 bg-emerald-100 rounded-2xl text-emerald-600">
            <Users className="w-10 h-10" />
          </div>
          <div>
            <p className="text-emerald-700 font-extrabold uppercase tracking-wider text-sm mb-1">Currently Inside</p>
            <h2 className="text-5xl font-black text-slate-900">{insideCampus.length}</h2>
          </div>
        </div>

        <div className="card p-6 bg-white border-amber-200 flex items-center gap-6 shadow-sm">
          <div className="p-4 bg-amber-100 rounded-2xl text-amber-600">
            <Clock className="w-10 h-10" />
          </div>
          <div>
            <p className="text-amber-700 font-extrabold uppercase tracking-wider text-sm mb-1">Expected Today</p>
            <h2 className="text-5xl font-black text-slate-900">{expectedToday.length}</h2>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>
      ) : (
        <div className="card overflow-hidden bg-white border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-extrabold text-slate-900">Active Visitor Log</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-4 font-bold">Pass Code</th>
                  <th className="p-4 font-bold">Visitor Name</th>
                  <th className="p-4 font-bold">Host Flat</th>
                  <th className="p-4 font-bold">Purpose</th>
                  <th className="p-4 font-bold">Check-in Time</th>
                  <th className="p-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...insideCampus, ...expectedToday].map(pass => (
                  <tr key={pass._id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-slate-600">{pass.passCode}</td>
                    <td className="p-4 text-slate-900 font-extrabold">{pass.visitorName}</td>
                    <td className="p-4 text-slate-600 font-medium">Flat {pass.unitNumber}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">{pass.purpose}</span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {pass.checkInTime ? new Date(pass.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        pass.status === 'INSIDE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {pass.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {insideCampus.length === 0 && expectedToday.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">No active visitors or expected guests today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVisitors;

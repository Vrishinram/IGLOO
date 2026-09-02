import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTickets, getUnitStatus, getVisitorPasses } from '../../services/api';
import { MaintenanceTicket, Unit, VisitorPass } from '../../types';
import { Wrench, Wallet, Users, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [unit, setUnit] = useState<Unit | null>(null);
  const [visitors, setVisitors] = useState<VisitorPass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ticketsRes, unitsRes, visitorsRes] = await Promise.all([
          getTickets(),
          getUnitStatus(),
          getVisitorPasses()
        ]);
        
        // Filter for this resident's data
        const myTickets = ticketsRes.data.tickets.filter(t => t.unitNumber === user?.unitNumber);
        setTickets(myTickets);
        
        const myUnit = unitsRes.data.units.find(u => u.unitNumber === user?.unitNumber);
        if (myUnit) setUnit(myUnit);
        
        const myVisitors = visitorsRes.data.passes.filter(v => v.unitNumber === user?.unitNumber);
        setVisitors(myVisitors);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    if (user?.unitNumber) fetchData();
  }, [user]);

  const activeTickets = tickets.filter(t => !['RESOLVED', 'CLOSED'].includes(t.status));
  const pendingDues = unit?.totalDue !== undefined ? unit.totalDue : (unit?.currentDueStatus !== 'PAID' ? unit?.monthlyMaintenanceFee || 0 : 0);
  const recentVisitors = visitors.filter(v => ['PRE_APPROVED', 'INSIDE'].includes(v.status));

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome back, {user?.name}</h1>
          <p className="text-slate-500 font-medium">Unit: {user?.unitNumber}</p>
        </div>
        <button 
          onClick={async () => {
            if (window.confirm('Are you sure you want to trigger an Emergency SOS Alert to Security?')) {
              try {
                const { triggerSOS } = await import('../../services/api');
                await triggerSOS();
                alert('SOS Alert Sent to Security!');
              } catch(e) {
                alert('Failed to send SOS');
              }
            }
          }}
          className="bg-red-500 hover:bg-red-600 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-pulse hover:animate-none transition-all"
        >
          <AlertCircle className="w-6 h-6 fill-red-600 text-white" />
          EMERGENCY SOS
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-600 text-sm font-bold">Active Tickets</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{activeTickets.length}</h3>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Wrench className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <Link to="/resident/maintenance" className="text-emerald-700 text-sm font-bold mt-4 flex items-center gap-1 hover:text-emerald-800">
            View Maintenance <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="stat-card bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-600 text-sm font-bold">Pending Dues</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">₹{pendingDues.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <Link to="/resident/finances" className="text-blue-700 text-sm font-bold mt-4 flex items-center gap-1 hover:text-blue-800">
            Pay Dues <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="stat-card bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-600 text-sm font-bold">Expected/Active Visitors</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{recentVisitors.length}</h3>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <Link to="/resident/visitors" className="text-amber-700 text-sm font-bold mt-4 flex items-center gap-1 hover:text-amber-800">
            Manage Visitors <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets Activity */}
        <div className="card p-6 bg-white border-slate-200 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">Recent Maintenance</h2>
          {tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.slice(0, 3).map(ticket => (
                <div key={ticket._id} className="flex items-start justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{ticket.title}</h4>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 font-bold uppercase tracking-wider rounded-full badge-${ticket.status.toLowerCase()}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 font-medium flex flex-col items-center">
              <CheckCircle2 className="w-8 h-8 mb-2 text-slate-400" />
              <p>No active issues. All good!</p>
            </div>
          )}
        </div>

        {/* Recent Visitors Activity */}
        <div className="card p-6 bg-white border-slate-200 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">Recent Visitors</h2>
          {visitors.length > 0 ? (
            <div className="space-y-4">
              {visitors.slice(0, 3).map(pass => (
                <div key={pass._id} className="flex items-start justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{pass.visitorName}</h4>
                    <p className="text-xs font-medium text-slate-500">Pass: {pass.passCode}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                      {pass.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{new Date(pass.expectedDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 font-medium text-slate-500">
              <p>No recent visitors.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;

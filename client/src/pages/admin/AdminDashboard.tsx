import React, { useState, useEffect } from 'react';
import { getTickets, getTreasurySummary, getVisitorPasses, getUnitStatus } from '../../services/api';
import { MaintenanceTicket, TreasurySummary, VisitorPass, Unit } from '../../types';
import { Wrench, Wallet, Users, Home, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const AdminDashboard = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [visitors, setVisitors] = useState<VisitorPass[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ticRes, sumRes, visRes, unitRes] = await Promise.all([
          getTickets(),
          getTreasurySummary(),
          getVisitorPasses(),
          getUnitStatus()
        ]);
        setTickets(ticRes.data.tickets);
        const s = sumRes.data;
        setSummary({
          totalBalance: s.totalBalance,
          monthlyInflow: s.currentMonthInflow,
          monthlyOutflow: s.currentMonthOutflow,
          currentMonthInflow: s.currentMonthInflow,
          currentMonthOutflow: s.currentMonthOutflow,
          categoryBreakdown: s.categoryBreakdown
        });
        setVisitors(visRes.data.passes);
        setUnits(unitRes.data.units);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading admin dashboard...</div>;

  const openTickets = tickets.filter(t => ['OPEN', 'ASSIGNED', 'IN_PROGRESS'].includes(t.status));
  const emergencyTickets = tickets.filter(t => t.priority === 'EMERGENCY' && t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  const visitorsToday = visitors.filter(v => new Date(v.expectedDate).toDateString() === new Date().toDateString());

  // Chart Data
  const ticketStatusData = [
    { name: 'Open', value: tickets.filter(t => t.status === 'OPEN').length, color: '#f59e0b' },
    { name: 'In Progress', value: tickets.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length, color: '#3b82f6' },
    { name: 'Resolved', value: tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length, color: '#10b981' }
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">Silver Oak Heights Management</p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card bg-white border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-sm font-bold">Total Units</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{units.length}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg"><Home className="w-5 h-5 text-blue-500" /></div>
          </div>
        </div>

        <div className="stat-card border-amber-200 bg-amber-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-amber-700 text-sm font-bold">Active Tickets</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{openTickets.length}</h3>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg"><Wrench className="w-5 h-5 text-amber-600" /></div>
          </div>
          <Link to="/admin/maintenance" className="text-amber-600 text-xs font-bold mt-3 flex items-center gap-1 hover:text-amber-700">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="stat-card border-primary-200 bg-primary-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-primary-700 text-sm font-bold">Monthly Collections</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">₹{summary?.monthlyInflow.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg"><Wallet className="w-5 h-5 text-primary-600" /></div>
          </div>
          <Link to="/admin/treasury" className="text-primary-600 text-xs font-bold mt-3 flex items-center gap-1 hover:text-primary-700">
            Manage Treasury <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="stat-card border-purple-200 bg-purple-50">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-purple-700 text-sm font-bold">Visitors Today</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{visitorsToday.length}</h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
          </div>
          <Link to="/admin/visitors" className="text-purple-600 text-xs font-bold mt-3 flex items-center gap-1 hover:text-purple-700">
            Live Monitor <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Status Chart */}
        <div className="card p-6 lg:col-span-1 bg-white border border-slate-200 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">Ticket Status</h2>
          {ticketStatusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ticketStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    itemStyle={{ color: '#0f172a' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {ticketStatusData.map(d => (
                  <div key={d.name} className="flex items-center gap-1 text-xs font-bold text-slate-600">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 font-medium text-sm">No ticket data</div>
          )}
        </div>

        {/* High Priority Tickets */}
        <div className="card p-6 lg:col-span-2 flex flex-col bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Attention Needed</h2>
            <Link to="/admin/maintenance" className="text-primary-600 text-sm font-bold hover:text-primary-700">View All</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3">
            {emergencyTickets.length > 0 ? emergencyTickets.map(ticket => (
              <div key={ticket._id} className="p-4 rounded-xl bg-red-50 border border-red-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge-emergency px-2 py-0.5 rounded text-[10px] uppercase font-bold text-red-700 bg-red-100">Emergency</span>
                    <span className="text-slate-600 font-medium text-xs">Flat {ticket.unitNumber}</span>
                  </div>
                  <h3 className="text-slate-900 font-bold">{ticket.title}</h3>
                </div>
                <Link to="/admin/maintenance" className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors shrink-0">
                  Manage
                </Link>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 pt-8">
                <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-6 h-6 text-primary-600" />
                </div>
                <p className="font-medium">No high-priority issues.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

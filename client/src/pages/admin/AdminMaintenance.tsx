import React, { useState, useEffect } from 'react';
import { getTickets, assignTicket, updateTicketStatus, getTechnicians, approveTicketExpense } from '../../services/api';
import { MaintenanceTicket } from '../../types';
import { Wrench, Loader2, Search, Filter } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const AdminMaintenance = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [technicians, setTechnicians] = useState<{_id: string, name: string}[]>([]);

  const fetchTickets = async () => {
    try {
      const res = await getTickets();
      // Sort Emergency first, then newest
      const sorted = res.data.tickets.sort((a, b) => {
        if (a.priority === 'EMERGENCY' && b.priority !== 'EMERGENCY') return -1;
        if (b.priority === 'EMERGENCY' && a.priority !== 'EMERGENCY') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setTickets(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    getTechnicians().then(res => setTechnicians(res.data.technicians)).catch(console.error);
  }, []);

  const handleAssign = async (ticketId: string, technicianId: string) => {
    if (!technicianId) return;
    try {
      await assignTicket(ticketId, technicianId);
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert('Failed to assign ticket');
    }
  };

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    try {
      await updateTicketStatus(ticketId, status);
      fetchTickets();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleApproveExpense = async (ticketId: string) => {
    try {
      await approveTicketExpense(ticketId);
      alert('Expense approved and routed to ledger successfully!');
      fetchTickets();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to approve expense');
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.unitNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Maintenance Hub</h1>
          <p className="text-slate-500 font-medium">Manage and assign society issues</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search ID, Title, or Unit..." 
            className="input-field w-full pl-10 bg-white border-slate-200 text-slate-900 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            className="select-field w-full pl-10 appearance-none bg-white border-slate-200 text-slate-900 shadow-sm font-medium"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>
      ) : filteredTickets.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 bg-white border border-slate-200 shadow-sm">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-20 text-slate-400" />
          <p className="font-bold">No tickets found matching criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map(ticket => (
            <div key={ticket._id} className={twMerge(
              "card p-5 border-l-4 bg-white shadow-sm border border-slate-200",
              ticket.priority === 'EMERGENCY' ? "border-l-red-500" :
              ticket.priority === 'HIGH' ? "border-l-amber-500" :
              ticket.priority === 'MEDIUM' ? "border-l-blue-500" : "border-l-slate-300"
            )}>
              <div className="flex flex-col lg:flex-row gap-6 justify-between">
                
                {/* Info Section */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">{ticket.ticketId}</span>
                    <span className="text-sm font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">Flat {ticket.unitNumber}</span>
                    <span className={`badge-${ticket.status.toLowerCase()} px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`badge-${ticket.priority.toLowerCase()} px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider`}>
                      {ticket.priority}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-extrabold text-slate-900">{ticket.title}</h3>
                  <p className="text-slate-600 text-sm max-w-3xl font-medium">{ticket.description}</p>
                  
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-500 pt-2 border-t border-slate-100">
                    <span>Category: <strong className="text-slate-800">{ticket.category}</strong></span>
                    <span>Reported by: <strong className="text-slate-800">{typeof ticket.reportedBy === 'string' ? ticket.reportedBy : ticket.reportedBy.name}</strong></span>
                    <span>Created: <strong className="text-slate-800">{new Date(ticket.createdAt).toLocaleDateString()}</strong></span>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-col gap-3 min-w-[200px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                  
                  {/* Assignment Dropdown */}
                  {['OPEN', 'ASSIGNED'].includes(ticket.status) && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Assign Technician</label>
                      <select 
                        className="select-field w-full text-sm py-1.5 h-auto bg-slate-50 border-slate-200 text-slate-800 font-bold"
                        value={typeof ticket.assignedTo === 'string' ? ticket.assignedTo : ticket.assignedTo?._id || ''}
                        onChange={(e) => handleAssign(ticket._id, e.target.value)}
                      >
                        <option value="">-- Unassigned --</option>
                        {technicians.map(t => (
                          <option key={t._id} value={t._id}>{t.name}</option>
                        ))}
                        <option value="SYSTEM_TECH">Any Available Tech</option>
                      </select>
                    </div>
                  )}

                  {/* Status Override */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Override Status</label>
                    <select 
                      className="select-field w-full text-sm py-1.5 h-auto bg-slate-50 border-slate-200 text-slate-800 font-bold"
                      value={ticket.status}
                      onChange={(e) => handleStatusUpdate(ticket._id, e.target.value)}
                    >
                      <option value="OPEN">Open</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                  
                  {/* Expense Approval */}
                  {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && ticket.paymentStatus === 'UNBILLED' && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-2 rounded text-xs text-slate-700 space-y-1 font-medium border border-slate-200">
                        <p className="font-extrabold text-slate-900 border-b border-slate-200 pb-1 mb-1">Technician Expenses</p>
                        <p className="flex justify-between"><span>Parts:</span> <span className="font-bold">₹{ticket.partsCost || 0}</span></p>
                        <p className="flex justify-between"><span>Labor:</span> <span className="font-bold">₹{ticket.laborCost || 0}</span></p>
                        <p className="flex justify-between text-primary-700 font-bold border-t border-slate-200 pt-1 mt-1"><span>Total:</span> <span>₹{(ticket.partsCost || 0) + (ticket.laborCost || 0)}</span></p>
                        {ticket.expenseNotes && <p className="pt-1 italic truncate" title={ticket.expenseNotes}>"{ticket.expenseNotes}"</p>}
                      </div>
                      <button 
                        onClick={() => handleApproveExpense(ticket._id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-md shadow-sm transition-colors uppercase tracking-wider"
                      >
                        Approve & Book to Ledger
                      </button>
                    </div>
                  )}

                  {ticket.paymentStatus === 'PAID_BY_TREASURY' && (
                    <div className="mt-2 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded font-extrabold text-center uppercase shadow-sm">
                      Paid by Society Treasury
                    </div>
                  )}
                  {ticket.paymentStatus === 'BILLED_TO_RESIDENT' && (
                    <div className="mt-2 text-[10px] text-blue-700 bg-blue-50 border border-blue-100 p-2 rounded font-extrabold text-center uppercase shadow-sm">
                      Billed to Resident Dues
                    </div>
                  )}

                  {ticket.aiTriageAnalysis && (
                    <div className="mt-auto pt-2 text-[10px] text-purple-700 bg-purple-50 border border-purple-100 p-2 rounded flex flex-col gap-1 shadow-sm">
                      <span className="font-extrabold flex items-center gap-1">✨ AI Triaged</span>
                      <span className="truncate font-medium" title={ticket.aiTriageAnalysis}>{ticket.aiTriageAnalysis}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminMaintenance;

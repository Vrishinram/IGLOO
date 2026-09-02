import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTickets, updateTicketStatus } from '../../services/api';
import { MaintenanceTicket } from '../../types';
import { Wrench, Loader2, CheckCircle2, Play, Sparkles } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const TechTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [resolveModal, setResolveModal] = useState<{isOpen: boolean, ticketId: string | null}>({isOpen: false, ticketId: null});
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [partsCost, setPartsCost] = useState<number | ''>('');
  const [laborCost, setLaborCost] = useState<number | ''>('');
  const [expenseNotes, setExpenseNotes] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await getTickets();
      const myTasks = res.data.tickets.filter(t => {
        if (!t.assignedTo) return false;
        if (typeof t.assignedTo === 'string') return t.assignedTo === user?._id;
        return t.assignedTo._id === user?._id;
      });
      myTasks.sort((a, b) => {
        if (a.status === 'RESOLVED' || a.status === 'CLOSED') return 1;
        if (b.status === 'RESOLVED' || b.status === 'CLOSED') return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setTasks(myTasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const handleStartWork = async (id: string) => {
    try {
      await updateTicketStatus(id, 'IN_PROGRESS');
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModal.ticketId) return;
    try {
      await updateTicketStatus(resolveModal.ticketId, 'RESOLVED', resolutionNotes, Number(partsCost) || 0, Number(laborCost) || 0, expenseNotes);
      setResolveModal({isOpen: false, ticketId: null});
      setResolutionNotes('');
      setPartsCost('');
      setLaborCost('');
      setExpenseNotes('');
      fetchTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to resolve task');
    }
  };

  if (loading) return <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Assigned Tasks</h1>
        <p className="text-slate-500 font-medium">Manage and resolve your tickets</p>
      </div>

      {tasks.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 border-dashed border-slate-300 bg-slate-50">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-extrabold text-slate-700 mb-2">No tasks assigned yet 🎉</h2>
          <p className="font-medium">You're all caught up!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {tasks.map(task => (
            <div key={task._id} className={twMerge(
              "card p-0 overflow-hidden border-l-4 flex flex-col bg-white shadow-sm",
              task.status === 'RESOLVED' || task.status === 'CLOSED' ? "border-l-slate-300 opacity-80 bg-slate-50" :
              task.priority === 'EMERGENCY' ? "border-l-red-500 border border-red-200" : "border-l-primary-600 border border-slate-200"
            )}>
              <div className="p-5 md:p-6 flex-1 flex flex-col md:flex-row gap-6">
                
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-extrabold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">Flat {task.unitNumber}</span>
                    <span className={`badge-${task.priority.toLowerCase()} px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider`}>
                      {task.priority}
                    </span>
                    <span className={`badge-${task.status.toLowerCase()} px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-extrabold text-slate-900">{task.title}</h3>
                  <p className="text-slate-600 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">{task.description}</p>
                  
                  {task.aiEstimatedTime && (
                    <div className="flex gap-4 text-xs font-bold text-slate-500 pt-2">
                      <span className="flex items-center gap-1 text-purple-700"><Sparkles className="w-3 h-3"/> AI Est. Time: {task.aiEstimatedTime}</span>
                      <span className="flex items-center gap-1 text-purple-700"><Sparkles className="w-3 h-3"/> AI Est. Cost: {task.aiEstimatedCost}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 gap-3">
                  {task.status === 'ASSIGNED' && (
                    <button 
                      onClick={() => handleStartWork(task._id)}
                      className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-extrabold rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm"
                    >
                      <Play className="w-5 h-5 fill-current" /> Start Work
                    </button>
                  )}
                  {task.status === 'IN_PROGRESS' && (
                    <button 
                      onClick={() => setResolveModal({isOpen: true, ticketId: task._id})}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Mark Resolved
                    </button>
                  )}
                  {(task.status === 'RESOLVED' || task.status === 'CLOSED') && (
                    <div className="text-center space-y-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <p className="text-sm font-extrabold text-emerald-700 uppercase tracking-wider">Completed</p>
                      {task.resolutionNotes && <p className="text-xs text-slate-500 font-medium mt-2 truncate">Note: {task.resolutionNotes}</p>}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal.isOpen && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-content w-full max-w-md p-6 bg-white border border-slate-200 shadow-xl rounded-xl">
            <h2 className="text-xl font-extrabold text-slate-900 mb-4">Complete Task</h2>
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Resolution Notes (Required)</label>
                <textarea 
                  required 
                  rows={2} 
                  className="input-field w-full resize-none bg-slate-50 border-slate-200 text-slate-900 font-medium"
                  placeholder="What work was done?"
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 mt-2">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Parts Cost (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    className="input-field w-full bg-slate-50 border-slate-200 text-slate-900 font-medium"
                    placeholder="e.g. 500"
                    value={partsCost}
                    onChange={e => setPartsCost(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Labor Cost (₹)</label>
                  <input 
                    type="number"
                    min="0"
                    className="input-field w-full bg-slate-50 border-slate-200 text-slate-900 font-medium"
                    placeholder="e.g. 200"
                    value={laborCost}
                    onChange={e => setLaborCost(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>
              </div>

              {(partsCost !== '' || laborCost !== '') && (Number(partsCost) > 0 || Number(laborCost) > 0) && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Expense Details / Bill Info</label>
                  <input 
                    type="text"
                    className="input-field w-full bg-slate-50 border-slate-200 text-slate-900 font-medium"
                    placeholder="e.g. Purchased new tap washer from hardware store"
                    value={expenseNotes}
                    onChange={e => setExpenseNotes(e.target.value)}
                  />
                </div>
              )}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setResolveModal({isOpen: false, ticketId: null})} className="btn-secondary flex-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold">Cancel</button>
                <button type="submit" className="btn-primary flex-1 flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Resolve Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechTasks;

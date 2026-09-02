import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getTickets, createTicket, rateTicket, triageIssue } from '../../services/api';
import { MaintenanceTicket, AITriageResult } from '../../types';
import { Plus, Sparkles, Loader2, Star, CheckCircle, X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const ResidentMaintenance = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [issueScope, setIssueScope] = useState<'PRIVATE' | 'COMMON'>('PRIVATE');

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AITriageResult | null>(null);

  // Rating Modal
  const [ratingModal, setRatingModal] = useState<{isOpen: boolean, ticketId: string | null}>({isOpen: false, ticketId: null});
  const [rating, setRating] = useState(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    try {
      const res = await getTickets();
      setTickets(res.data.tickets.filter(t => t.unitNumber === user?.unitNumber));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAITriage = async () => {
    if (!title || !description) return alert("Please fill title and description first");
    setAiLoading(true);
    try {
      const res = await triageIssue(title, description);
      setAiResult(res.data.analysis);
      setCategory(res.data.analysis.category.toUpperCase());
    } catch (err) {
      console.error(err);
      alert("AI Triage failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createTicket({
        title,
        description,
        category: category || 'OTHER',
        issueScope: issueScope as 'PRIVATE' | 'COMMON',
        unitNumber: issueScope === 'COMMON' ? 'COMMON' : (user?.unitNumber || 'A-102'),
        priority: (aiResult?.priority as any) || 'LOW',
        aiEstimatedCost: aiResult?.estimatedCost,
        aiEstimatedTime: aiResult?.estimatedTime,
        aiTriageAnalysis: aiResult?.reasoning
      });
      setTickets([res.data.ticket, ...tickets]);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Failed to create ticket");
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setAiResult(null);
  };

  const handleRate = async () => {
    if (!ratingModal.ticketId || rating === 0) return;
    setRatingLoading(true);
    try {
      await rateTicket(ratingModal.ticketId, rating);
      setRatingModal({isOpen: false, ticketId: null});
      setRating(0);
      fetchTickets();
    } catch (err) {
      console.error(err);
    } finally {
      setRatingLoading(false);
    }
  };

  const filteredTickets = filter === 'ALL' 
    ? tickets 
    : tickets.filter(t => t.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Maintenance</h1>
          <p className="text-slate-500 font-medium">Report and track flat issues</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-sm"
        >
          <Plus className="w-5 h-5" /> Report Issue
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={twMerge(
              "px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors shadow-sm",
              filter === f 
                ? "bg-primary-600 text-white border border-primary-600" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            )}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 font-medium">No tickets found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map(ticket => (
            <div key={ticket._id} className="card p-5 bg-white border-slate-200 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400">{ticket.ticketId}</span>
                    <span className={`badge-${ticket.status.toLowerCase()} px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className={`badge-${ticket.priority.toLowerCase()} px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">{ticket.title}</h3>
                  <p className="text-slate-600 text-sm max-w-2xl font-medium">{ticket.description}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 font-medium">
                    <span>Category: <strong className="text-slate-700">{ticket.category}</strong></span>
                    <span>Date: <strong className="text-slate-700">{new Date(ticket.createdAt).toLocaleDateString()}</strong></span>
                    {ticket.assignedTo && typeof ticket.assignedTo !== 'string' && (
                      <span>Assigned to: <strong className="text-slate-700">{(ticket.assignedTo as any).name}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between min-w-[120px]">
                  {ticket.status === 'RESOLVED' && !ticket.residentRating && (
                    <button 
                      onClick={() => setRatingModal({isOpen: true, ticketId: ticket._id})}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 border border-emerald-200 shadow-sm"
                    >
                      <Star className="w-4 h-4" /> Rate & Close
                    </button>
                  )}
                  {ticket.residentRating ? (
                    <div className="flex gap-0.5 text-amber-400">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-4 h-4 ${star <= (ticket.residentRating || 0) ? 'fill-current' : 'text-slate-300'}`} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-content w-full max-w-lg p-6 bg-white border border-slate-200 shadow-xl rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-extrabold text-slate-900">Report Issue</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { label: 'Plumbing Leak', title: 'Leaking pipe', category: 'PLUMBING', desc: 'There is a plumbing leak that needs immediate fixing.' },
                { label: 'Electrical Spark', title: 'Sparking switch', category: 'ELECTRICAL', desc: 'A switch is sparking and needs an electrician.' },
                { label: 'AC Issue', title: 'AC not cooling', category: 'APPLIANCE', desc: 'The air conditioner is running but not cooling.' }
              ].map((issue, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="badge bg-primary-50 text-primary-600 hover:bg-primary-100 cursor-pointer border border-primary-200 px-3 py-1 rounded text-xs font-bold"
                  onClick={() => {
                    setTitle(issue.title);
                    setCategory(issue.category);
                    setDescription(issue.desc);
                  }}
                >
                  {issue.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
                <input required type="text" className="input-field w-full bg-slate-50 border-slate-200 text-slate-900" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea required rows={3} className="input-field w-full resize-none bg-slate-50 border-slate-200 text-slate-900" value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="flex justify-between items-end gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Issue Scope</label>
                  <select required className="select-field w-full bg-slate-50 border-slate-200 text-slate-900" value={issueScope} onChange={e => setIssueScope(e.target.value as any)}>
                    <option value="PRIVATE">Inside my Flat (Private)</option>
                    <option value="COMMON">Society Area (Common)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select required className="select-field w-full bg-slate-50 border-slate-200 text-slate-900" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">Select Category</option>
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical</option>
                    <option value="CARPENTRY">Carpentry</option>
                    <option value="CIVIL">Civil</option>
                    <option value="APPLIANCE">Appliance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <button 
                  type="button" 
                  onClick={handleAITriage}
                  disabled={aiLoading || !title}
                  className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2 whitespace-nowrap h-[42px] font-bold shadow-sm"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  AI Diagnose
                </button>
              </div>

              {aiResult && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-2 mt-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-purple-700 text-sm font-extrabold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI Analysis Complete
                    </span>
                    <span className={`badge-${aiResult.priority.toLowerCase()} px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider`}>
                      {aiResult.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 font-medium">{aiResult.reasoning}</p>
                  <div className="flex gap-4 text-xs text-slate-500 font-bold pt-2 border-t border-purple-200">
                    <span>Est. Cost: <span className="text-slate-900">{aiResult.estimatedCost}</span></span>
                    <span>Est. Time: <span className="text-slate-900">{aiResult.estimatedTime}</span></span>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold">Cancel</button>
                <button type="submit" className="btn-primary flex-1 bg-primary-600 hover:bg-primary-700 text-white font-bold">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModal.isOpen && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-content w-full max-w-sm p-6 text-center bg-white border border-slate-200 shadow-xl rounded-xl">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">Rate Service</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">How was your experience with the technician?</p>
            
            <div className="flex justify-center gap-2 mb-8">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star className={`w-10 h-10 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRatingModal({isOpen: false, ticketId: null})} className="btn-secondary flex-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold">Cancel</button>
              <button 
                onClick={handleRate} 
                disabled={rating === 0 || ratingLoading}
                className="btn-primary flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold"
              >
                {ratingLoading && <Loader2 className="w-4 h-4 animate-spin" />} Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentMaintenance;

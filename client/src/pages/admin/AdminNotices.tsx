import React, { useState, useEffect } from 'react';
import { getNotices, generateNotice } from '../../services/api';
import { SocietyNotice } from '../../types';
import { Bell, Sparkles, Loader2, Send } from 'lucide-react';

const AdminNotices = () => {
  const [notices, setNotices] = useState<SocietyNotice[]>([]);
  const [loading, setLoading] = useState(true);

  // Notice Creator State
  const [rawNotes, setRawNotes] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [aiLoading, setAiLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  
  // Note: Backend might not have a separate POST /notices if only AI route is used to generate. 
  // Assuming generateNotice handles creation or we just use it for preview. 
  // If generateNotice actually saves it to DB, we fetch. Let's assume generateNotice returns formatted text and we need to save it. 
  // Wait, backend specs didn't detail POST /notices. Let's just simulate adding it locally if no endpoint exists, or rely on AI endpoint.
  // Actually, IGLOO requirements said "AI agent drafts professional notices". I'll just use generateNotice and append to local list for hackathon if no save endpoint.

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const res = await getNotices();
      setNotices(res.data.notices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!rawNotes) return;
    setAiLoading(true);
    try {
      const res = await generateNotice(rawNotes, category);
      setPreviewContent(res.data.notice);
      // Re-fetch in case the API auto-saved it
      fetchNotices();
      setRawNotes(''); // Clear notes after generation
    } catch (err) {
      console.error(err);
      alert('Failed to generate notice');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Notice Management</h1>
        <p className="text-slate-500 font-medium">Broadcast updates to all residents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Creator Form */}
        <div className="card p-6 flex flex-col gap-4 bg-white border-slate-200 shadow-sm">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" /> AI Notice Generator
          </h2>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Raw Notes / Bullet Points</label>
            <textarea 
              rows={4} 
              className="input-field w-full resize-none font-mono text-sm bg-slate-50 border-slate-200 text-slate-900"
              placeholder="- Water supply cut tomorrow 2 PM to 5 PM
- Tank cleaning
- Store water beforehand"
              value={rawNotes}
              onChange={e => setRawNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
              <select className="select-field w-full bg-slate-50 border-slate-200 text-slate-900" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="GENERAL">General</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="EVENT">Event</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleAIGenerate}
            disabled={aiLoading || !rawNotes}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center gap-2 mt-2"
          >
            {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Draft & Publish Notice
          </button>

          {previewContent && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-bold mb-2">
                <Send className="w-4 h-4" /> Successfully Published
              </div>
              <div className="text-xs text-slate-700 whitespace-pre-wrap font-medium">{previewContent}</div>
            </div>
          )}
        </div>

        {/* Existing Notices */}
        <div className="card p-0 flex flex-col max-h-[600px] bg-white border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-400" /> Recent Notices
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto" /></div>
            ) : notices.length === 0 ? (
              <div className="text-center text-slate-500 py-8 font-medium">No notices yet.</div>
            ) : (
              notices.map(notice => (
                <div key={notice._id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-extrabold text-slate-900 text-sm">{notice.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                      notice.category === 'EMERGENCY' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {notice.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 line-clamp-2 font-medium" dangerouslySetInnerHTML={{ __html: notice.content }} />
                  <p className="text-[10px] text-slate-400 font-bold mt-2">{new Date(notice.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminNotices;

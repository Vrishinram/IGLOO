import React, { useState, useEffect } from 'react';
import { getNotices } from '../../services/api';
import { SocietyNotice } from '../../types';
import { Bell, Loader2, AlertTriangle, Info, Wrench, Calendar as CalIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const ResidentNotices = () => {
  const [notices, setNotices] = useState<SocietyNotice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchNotices();
  }, []);

  const getIcon = (category: string) => {
    switch (category) {
      case 'EMERGENCY': return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'MAINTENANCE': return <Wrench className="w-6 h-6 text-amber-500" />;
      case 'EVENT': return <CalIcon className="w-6 h-6 text-purple-500" />;
      default: return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Notice Board</h1>
        <p className="text-slate-500 font-medium">Important updates from society committee</p>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>
      ) : notices.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 font-medium flex flex-col items-center justify-center border-dashed border-slate-300 bg-slate-50">
          <Bell className="w-12 h-12 text-slate-400 mb-3" />
          <p>No notices available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map(notice => (
            <div 
              key={notice._id} 
              className={twMerge(
                "card p-5 md:p-6 transition-all bg-white border-slate-200 shadow-sm",
                notice.isEmergency ? "border-red-200 bg-red-50 shadow-sm" : ""
              )}
            >
              <div className="flex gap-4 items-start">
                <div className={twMerge(
                  "p-3 rounded-xl shrink-0 mt-1",
                  notice.category === 'EMERGENCY' ? "bg-red-100" :
                  notice.category === 'MAINTENANCE' ? "bg-amber-100" :
                  notice.category === 'EVENT' ? "bg-purple-100" : "bg-blue-100"
                )}>
                  {getIcon(notice.category)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                    <h2 className={twMerge(
                      "text-xl font-extrabold",
                      notice.isEmergency ? "text-red-700" : "text-slate-900"
                    )}>
                      {notice.title}
                    </h2>
                    <span className="text-xs font-bold text-slate-600 whitespace-nowrap bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      {new Date(notice.createdAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: notice.content }} className="text-slate-600 font-medium text-sm md:text-base leading-relaxed whitespace-pre-wrap" />
                  </div>
                  
                  <div className="pt-3 flex gap-2">
                    {notice.isEmergency && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-red-700 border border-red-200 animate-pulse">
                        Emergency
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                      {notice.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResidentNotices;

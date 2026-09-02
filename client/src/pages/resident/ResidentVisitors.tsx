import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getVisitorPasses, createVisitorPass } from '../../services/api';
import { VisitorPass } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Plus, Loader2, X, Share2, Calendar, Clock } from 'lucide-react';

const ResidentVisitors = () => {
  const { user } = useAuth();
  const [passes, setPasses] = useState<VisitorPass[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    purpose: 'GUEST',
    vehicleNumber: '',
    expectedDate: new Date().toISOString().split('T')[0]
  });
  const [createLoading, setCreateLoading] = useState(false);

  // New Pass state
  const [newPass, setNewPass] = useState<VisitorPass | null>(null);

  useEffect(() => {
    fetchPasses();
  }, [user]);

  const fetchPasses = async () => {
    try {
      const res = await getVisitorPasses();
      setPasses(res.data.passes.filter(p => p.unitNumber === user?.unitNumber));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await createVisitorPass(formData as any);
      setNewPass(res.data.pass);
      setPasses([res.data.pass, ...passes]);
      setIsModalOpen(false);
      // reset form
      setFormData({
        visitorName: '',
        visitorPhone: '',
        purpose: 'GUEST',
        vehicleNumber: '',
        expectedDate: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error(err);
      alert("Failed to create pass");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleShare = () => {
    if (!newPass) return;
    const text = `Visitor Pass for IGLOO Society%0A*Name*: ${newPass.visitorName}%0A*Host Flat*: ${newPass.unitNumber}%0A*Pass Code*: ${newPass.passCode}%0A*Date*: ${new Date(newPass.expectedDate).toLocaleDateString()}%0A%0AShow this code at the main gate.`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Visitors</h1>
          <p className="text-slate-500 font-medium">Pre-approve guests and services</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-sm">
          <Plus className="w-5 h-5" /> Create Visitor Pass
        </button>
      </div>

      {newPass && (
        <div className="card p-6 bg-white border-emerald-200 shadow-sm flex flex-col md:flex-row gap-8 items-center justify-center relative overflow-hidden mb-8">
          <button onClick={() => setNewPass(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <QRCodeSVG value={newPass.passCode} size={150} level="H" />
          </div>
          
          <div className="text-center md:text-left space-y-3">
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 font-extrabold rounded-full text-xs uppercase tracking-wider mb-2">
              Pass Generated Successfully
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-widest font-mono">{newPass.passCode}</h2>
            <div className="text-slate-600 space-y-1 text-sm font-medium">
              <p><span className="text-slate-400 font-bold">Visitor:</span> {newPass.visitorName}</p>
              <p><span className="text-slate-400 font-bold">Host:</span> Flat {newPass.unitNumber}</p>
              <p className="flex items-center justify-center md:justify-start gap-1">
                <Calendar className="w-4 h-4 text-slate-400" /> {new Date(newPass.expectedDate).toLocaleDateString()}
              </p>
            </div>
            
            <button onClick={handleShare} className="mt-4 px-6 py-2 bg-[#25D366] text-white font-bold rounded-lg hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 w-full md:w-auto shadow-sm">
              <Share2 className="w-4 h-4" /> Share via WhatsApp
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" /></div>
      ) : passes.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 font-medium flex flex-col items-center justify-center border-dashed border-slate-300 bg-slate-50">
          <Users className="w-12 h-12 text-slate-400 mb-3" />
          <p>No visitor passes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {passes.map(pass => (
            <div key={pass._id} className="card p-5 relative overflow-hidden bg-white border-slate-200 shadow-sm">
              <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg text-[10px] font-extrabold uppercase tracking-wider ${
                pass.status === 'PRE_APPROVED' ? 'bg-amber-100 text-amber-700' :
                pass.status === 'INSIDE' ? 'bg-emerald-100 text-emerald-700' :
                pass.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-700'
              }`}>
                {pass.status.replace('_', ' ')}
              </div>
              
              <div className="mt-2">
                <h3 className="text-lg font-extrabold text-slate-900 mb-1">{pass.visitorName}</h3>
                <p className="text-2xl font-mono font-black text-slate-400 tracking-widest mb-4">{pass.passCode}</p>
                
                <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span>Purpose</span>
                    <strong className="text-slate-700">{pass.purpose}</strong>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span>Expected</span>
                    <strong className="text-slate-700">{new Date(pass.expectedDate).toLocaleDateString()}</strong>
                  </div>
                  {pass.checkInTime && (
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span>In</span>
                      <strong className="text-emerald-600 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(pass.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                    </div>
                  )}
                  {pass.checkOutTime && (
                    <div className="flex justify-between">
                      <span>Out</span>
                      <strong className="text-slate-600 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(pass.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-content w-full max-w-md p-6 bg-white border border-slate-200 shadow-xl rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-extrabold text-slate-900">Pre-approve Visitor</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Visitor Name</label>
                <input required type="text" className="input-field w-full bg-slate-50 border-slate-200 text-slate-900" value={formData.visitorName} onChange={e => setFormData({...formData, visitorName: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                  <input required type="tel" className="input-field w-full bg-slate-50 border-slate-200 text-slate-900" value={formData.visitorPhone} onChange={e => setFormData({...formData, visitorPhone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Purpose</label>
                  <select required className="select-field w-full bg-slate-50 border-slate-200 text-slate-900" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})}>
                    <option value="GUEST">Guest</option>
                    <option value="DELIVERY">Delivery</option>
                    <option value="CAB">Cab</option>
                    <option value="SERVICE">Service</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                  <input required type="date" className="input-field w-full bg-slate-50 border-slate-200 text-slate-900" value={formData.expectedDate} onChange={e => setFormData({...formData, expectedDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Vehicle (Opt)</label>
                  <input type="text" className="input-field w-full uppercase bg-slate-50 border-slate-200 text-slate-900" placeholder="e.g. MH12AB1234" value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold">Cancel</button>
                <button type="submit" disabled={createLoading} className="btn-primary flex-1 flex justify-center items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold">
                  {createLoading && <Loader2 className="w-4 h-4 animate-spin" />} Generate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResidentVisitors;

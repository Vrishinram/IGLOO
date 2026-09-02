import React, { useState, useEffect } from 'react';
import { createVisitorPass, checkInVisitor, getUnitStatus } from '../../services/api';
import { UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SecurityWalkIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    purpose: 'GUEST',
    unitNumber: '',
    vehicleNumber: '',
    expectedDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [units, setUnits] = useState<{unitNumber: string}[]>([]);

  useEffect(() => {
    getUnitStatus().then(res => setUnits(res.data.units)).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Create pass
      const createRes = await createVisitorPass(formData as any);
      // Immediately check-in
      await checkInVisitor(createRes.data.pass._id);
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/security/live-log');
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to register walk-in');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto pt-20 text-center">
        <CheckCircle2 className="w-24 h-24 text-emerald-500 mx-auto mb-6 animate-bounce" />
        <h2 className="text-3xl font-black text-slate-900 mb-2">Registration Complete!</h2>
        <p className="text-slate-500 font-medium">Visitor checked in successfully. Redirecting to log...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 pt-4">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-amber-100 rounded-xl">
          <UserPlus className="w-8 h-8 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Walk-in Registration</h1>
          <p className="text-slate-500 font-medium">Register and check-in unannounced visitors</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5 bg-white border-slate-200 shadow-sm">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Visitor Full Name</label>
          <input required type="text" className="input-field w-full text-lg py-3 bg-slate-50 border-slate-200 text-slate-900 font-medium" autoFocus value={formData.visitorName} onChange={e => setFormData({...formData, visitorName: e.target.value})} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Host Flat Number</label>
            <select required className="select-field w-full text-lg py-3 uppercase bg-slate-50 border-slate-200 text-slate-900 font-medium" value={formData.unitNumber} onChange={e => setFormData({...formData, unitNumber: e.target.value})}>
              <option value="">Select Flat</option>
              {units.map(u => (
                <option key={u.unitNumber} value={u.unitNumber}>{u.unitNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Phone Number</label>
            <input required type="tel" className="input-field w-full text-lg py-3 bg-slate-50 border-slate-200 text-slate-900 font-medium" value={formData.visitorPhone} onChange={e => setFormData({...formData, visitorPhone: e.target.value})} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Purpose</label>
            <select required className="select-field w-full text-lg py-3 bg-slate-50 border-slate-200 text-slate-900 font-medium" value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})}>
              <option value="DELIVERY">Delivery</option>
              <option value="GUEST">Guest</option>
              <option value="SERVICE">Service</option>
              <option value="CAB">Cab</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Vehicle (Optional)</label>
            <input type="text" className="input-field w-full text-lg py-3 uppercase bg-slate-50 border-slate-200 text-slate-900 font-medium" value={formData.vehicleNumber} onChange={e => setFormData({...formData, vehicleNumber: e.target.value})} />
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xl font-black rounded-xl transition-all flex justify-center items-center gap-3 shadow-sm"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Register & Check In'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SecurityWalkIn;

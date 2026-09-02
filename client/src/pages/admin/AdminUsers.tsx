import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { User } from '../../types';
import { Loader2, Plus, Trash2, Shield, Users as UsersIcon } from 'lucide-react';

const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('RESIDENT');
  const [unitNumber, setUnitNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [residentType, setResidentType] = useState('OWNER');
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/users', { name, email, role, unitNumber, phone, residentType });
      setIsModalOpen(false);
      setName(''); setEmail(''); setUnitNumber(''); setPhone('');
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">User Management</h1>
          <p className="text-slate-500 font-medium">Manage society residents, staff, and admins</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Name & Contact</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Unit</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-sm text-slate-500">{u.email} • {u.phone}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      u.role === 'ADMIN' ? 'bg-emerald-100 text-emerald-700' :
                      u.role === 'RESIDENT' ? 'bg-blue-100 text-blue-700' :
                      u.role === 'SECURITY' ? 'bg-amber-100 text-amber-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {u.role === 'RESIDENT' ? (
                      <div>
                        <div className="font-bold text-slate-700">{u.unitNumber}</div>
                        <div className="text-xs text-slate-500">{u.residentType}</div>
                      </div>
                    ) : <span className="text-slate-400">-</span>}
                  </td>
                  <td className="p-4">
                    <button onClick={() => handleDelete(u._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-extrabold text-slate-900">Add New User</h2>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full border-slate-200 rounded-lg bg-slate-50 text-slate-900 font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border-slate-200 rounded-lg bg-slate-50 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                  <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full border-slate-200 rounded-lg bg-slate-50 text-slate-900 font-medium" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} className="w-full border-slate-200 rounded-lg bg-slate-50 text-slate-900 font-medium">
                  <option value="RESIDENT">Resident</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SECURITY">Security</option>
                  <option value="TECHNICIAN">Technician</option>
                </select>
              </div>

              {role === 'RESIDENT' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Unit Number</label>
                    <input type="text" required={role==='RESIDENT'} value={unitNumber} onChange={e => setUnitNumber(e.target.value)} placeholder="e.g. A-101" className="w-full border-blue-200 rounded-lg bg-white text-slate-900 font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Resident Type</label>
                    <select value={residentType} onChange={e => setResidentType(e.target.value)} className="w-full border-blue-200 rounded-lg bg-white text-slate-900 font-medium">
                      <option value="OWNER">Owner</option>
                      <option value="TENANT">Tenant</option>
                    </select>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg flex items-center gap-2">
                  {creating && <Loader2 className="w-4 h-4 animate-spin" />} Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminUsers;

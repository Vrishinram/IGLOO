import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hexagon, Loader2, Shield, Wrench, Users, ShieldAlert, Key, ChevronRight } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const Login = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role?: string, emailStr?: string) => {
    setLoading(true);
    setError('');
    try {
      await quickLogin(role, emailStr);
      navigate('/');
    } catch (err: any) {
      setError('Quick login failed. Ensure database is seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col lg:flex-row bg-slate-50 font-sans">
      
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 overflow-hidden text-white flex-col justify-end p-8 xl:p-12">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat mix-blend-overlay opacity-60"
          style={{ backgroundImage: "url('/login-bg.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950 via-primary-900/60 to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-lg mb-8">
          <div className="flex items-center gap-2 mb-6 opacity-80 uppercase tracking-widest text-xs font-bold">
            <Hexagon className="w-5 h-5 fill-current" />
            <span>Smart Society Management</span>
          </div>
          
          <h1 className="text-6xl font-black mb-2 tracking-tighter text-white drop-shadow-lg">
            IGLOO
          </h1>
          <h2 className="text-3xl font-bold mb-6 text-primary-200 tracking-tight leading-tight">
            Society life, made simpler.
          </h2>
          
          <p className="text-sm text-primary-100 font-medium mb-6 leading-relaxed max-w-sm">
            Intelligent Gated-community Living & Operations Orchestrator. 
            Connect residents, maintenance, finance, and security from one trusted workspace.
          </p>
          <div className="flex items-center gap-4 border-t border-primary-800 pt-6">
            <div className="text-3xl font-black text-primary-300">4</div>
            <div className="text-xs text-primary-200 uppercase tracking-wider font-bold">Integrated<br/>Workspaces</div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-sm">
          
          <div className="lg:hidden flex items-center gap-2 mb-6 justify-center">
            <Hexagon className="w-8 h-8 text-primary-600 fill-primary-600/20" />
            <span className="text-2xl font-black text-slate-900 tracking-tight">IGLOO</span>
          </div>

          <div className="mb-6">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Welcome Back</p>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to your society</h2>
          </div>

          {error && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-bold text-center shadow-sm">
              {error}
            </div>
          )}

          {/* Standard Login */}
          <form onSubmit={handleLogin} className="space-y-3 mb-6">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Login ID / Email</label>
              <input 
                type="email" 
                className="input-field w-full border-slate-200 text-slate-900 bg-white shadow-sm font-medium h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                className="input-field w-full border-slate-200 text-slate-900 bg-white shadow-sm font-medium h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit" 
              className="w-full flex justify-between items-center bg-primary-700 text-white px-4 py-3.5 rounded-lg font-bold hover:bg-primary-800 transition-colors shadow-md mt-2"
              disabled={loading}
            >
              <span>{loading ? 'Signing in...' : 'Continue'}</span>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            </button>
          </form>

          {/* Quick Demo Access Grid */}
          <div>
            <div className="flex justify-between items-end mb-3 border-b border-slate-200 pb-2">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Quick Access (Demo)</h3>
              <span className="text-[10px] text-slate-400 font-bold">One click to explore</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleQuickLogin('ADMIN')} className="flex items-center justify-between p-3 rounded border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-left group bg-white">
                <div>
                  <div className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-700">Admin</div>
                  <div className="text-[10px] text-slate-500">Rajesh</div>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-emerald-500" />
              </button>
              
              <button onClick={() => handleQuickLogin('SECURITY')} className="flex items-center justify-between p-3 rounded border border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-colors text-left group bg-white">
                <div>
                  <div className="text-xs font-extrabold text-slate-800 group-hover:text-amber-700">Security</div>
                  <div className="text-[10px] text-slate-500">Bahadur</div>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-amber-500" />
              </button>

              <button onClick={() => handleQuickLogin('TECHNICIAN')} className="flex items-center justify-between p-3 rounded border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-colors text-left group bg-white">
                <div>
                  <div className="text-xs font-extrabold text-slate-800 group-hover:text-purple-700">Technician</div>
                  <div className="text-[10px] text-slate-500">Kumar</div>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-purple-500" />
              </button>

              <button onClick={() => handleQuickLogin(undefined, 'priya@igloo.com')} className="flex items-center justify-between p-3 rounded border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group bg-white">
                <div>
                  <div className="text-xs font-extrabold text-slate-800 group-hover:text-blue-700">Priya (Owner)</div>
                  <div className="text-[10px] text-slate-500">Flat A-101</div>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
              </button>

              <button onClick={() => handleQuickLogin(undefined, 'rahul@igloo.com')} className="flex items-center justify-between p-3 rounded border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group bg-white">
                <div>
                  <div className="text-xs font-extrabold text-slate-800 group-hover:text-blue-700">Rahul (Tenant)</div>
                  <div className="text-[10px] text-slate-500">Flat A-102</div>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
              </button>

              <button onClick={() => handleQuickLogin(undefined, 'anita@igloo.com')} className="flex items-center justify-between p-3 rounded border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group bg-white">
                <div>
                  <div className="text-xs font-extrabold text-slate-800 group-hover:text-blue-700">Anita (Owner)</div>
                  <div className="text-[10px] text-slate-500">Flat B-201</div>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
              </button>

              <button onClick={() => handleQuickLogin(undefined, 'vikram@igloo.com')} className="flex items-center justify-between p-3 rounded border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left group bg-white col-span-2">
                <div>
                  <div className="text-xs font-extrabold text-slate-800 group-hover:text-blue-700">Vikram (Tenant)</div>
                  <div className="text-[10px] text-slate-500">Flat B-202</div>
                </div>
                <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
              </button>

            </div>
          </div>
          
          <div className="mt-8 text-center text-[10px] text-slate-400 font-medium">
            Private community workspace · Secure access
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;

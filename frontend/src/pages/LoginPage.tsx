import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { Button } from '@/components/ui/button';
import {
  Kanban,
  ArrowRight,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Layers
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('kartik@gmail.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow
        await API.post('/users/create', { name: name.trim(), email: email.trim(), password });
        // Automatically login after registration
        const loginRes = await API.post('/users/login', { email: email.trim(), password });
        const { token, user } = loginRes.data.data;
        login(token, user);
      } else {
        // Login flow
        const response = await API.post('/users/login', { email: email.trim(), password });
        const { token, user } = response.data.data;
        login(token, user);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          (isRegister ? 'Registration failed. Please try again.' : 'Invalid email or password.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login helper
  const handleQuickDemo = () => {
    setEmail('kartik@gmail.com');
    setPassword('password123');
    setIsRegister(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-100/40 via-zinc-100/20 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-100/30 rounded-full blur-2xl pointer-events-none -z-10" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-zinc-200/40 rounded-full blur-2xl pointer-events-none -z-10" />

      {/* Main Form Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 mb-3 transition-transform hover:scale-105 duration-200">
            <Kanban className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center justify-center gap-2">
            DevFlow
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-full">
              Trello Edition
            </span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-medium">
            Next-gen project workspace & real-time team collaboration
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200/80 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden transition-all">
          {/* Segmented Auth Tabs */}
          <div className="p-2 bg-zinc-100/80 border-b border-zinc-200/70 flex gap-1 rounded-t-3xl">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                !isRegister
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                isRegister
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-7 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Name Field (Sign Up Only) */}
            {isRegister && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-xs font-bold text-zinc-700 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Kartik Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-300/80 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-700 block">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="kartik@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-zinc-50 border border-zinc-300/80 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-700 block">
                  Password
                </label>
                {!isRegister && (
                  <span
                    onClick={handleQuickDemo}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    title="Fill test credentials"
                  >
                    Quick fill demo
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-zinc-50 border border-zinc-300/80 rounded-xl text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs h-11 rounded-xl shadow-md shadow-indigo-600/15 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRegister ? 'Creating your account...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account & Continue' : 'Sign In to DevFlow'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            {/* Quick Demo Credentials Pill */}
            {!isRegister && (
              <div
                onClick={handleQuickDemo}
                className="mt-3 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between cursor-pointer hover:bg-zinc-100/80 transition group"
              >
                <div className="flex items-center gap-2 text-[11px] text-zinc-600 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Demo: <strong className="text-zinc-800">kartik@gmail.com</strong> / <strong className="text-zinc-800">password123</strong></span>
                </div>
                <span className="text-[10px] font-bold text-indigo-600 group-hover:underline">
                  Auto Fill
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Feature Pills Footer */}
        <div className="mt-8 flex items-center justify-center flex-wrap gap-4 text-[11px] text-zinc-500 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Real-time WebSockets</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-300" />
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Kanban Boards & Lists</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-300" />
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
            <span>JWT Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};

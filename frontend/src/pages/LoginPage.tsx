import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Kanban, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        await API.post('/users/create', { name, email, password });
        // Automatically login after successful registration
        const loginRes = await API.post('/users/login', { email, password });
        const { token, user } = loginRes.data.data;
        login(token, user);
      } else {
        // Login flow
        const response = await API.post('/users/login', { email, password });
        const { token, user } = response.data.data;
        login(token, user);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          (isRegister ? 'Registration failed. Try again.' : 'Invalid email or password.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col items-center justify-center p-4 font-sans text-zinc-900">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
          <Kanban className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">DevFlow</h1>
      </div>

      <Card className="w-full max-w-md bg-white border border-zinc-200/90 shadow-xl rounded-2xl overflow-hidden p-2">
        <CardHeader className="text-center pb-4 pt-6">
          <CardTitle className="text-xl font-bold text-zinc-900">
            {isRegister ? 'Create your DevFlow account' : 'Log in to continue'}
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500 mt-1">
            {isRegister
              ? 'Collaborate, manage boards, and ship projects with your team.'
              : 'Welcome back! Manage your boards and tasks effortlessly.'}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 px-6">
            {/* Error Message Alert */}
            {error && (
              <div className="p-3 text-xs rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium animate-in fade-in">
                {error}
              </div>
            )}

            {/* Name field (if Registering) */}
            {isRegister && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-700" htmlFor="name">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 rounded-xl focus:bg-white text-sm"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-zinc-700" htmlFor="email">
                Work Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-50 border-zinc-300 text-zinc-900 rounded-xl focus:bg-white text-sm"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-zinc-700" htmlFor="password">
                  Password
                </Label>
                {!isRegister && (
                  <span className="text-[11px] text-indigo-600 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-50 border-zinc-300 text-zinc-900 rounded-xl focus:bg-white text-sm"
              />
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-4 px-6 pt-2 pb-6">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl h-10 shadow-sm transition gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Sign Up' : 'Log In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>

            <div className="text-center text-xs text-zinc-500">
              {isRegister ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError('');
                    }}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    Log In
                  </button>
                </span>
              ) : (
                <span>
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError('');
                    }}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    Sign Up
                  </button>
                </span>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>

      <div className="mt-8 text-center text-xs text-zinc-400">
        DevFlow Trello Clone &bull; Real-Time Kanban with WebSockets
      </div>
    </div>
  );
};

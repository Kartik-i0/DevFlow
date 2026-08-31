import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {LoaderIcon} from "lucide-react";


export const LoginPage: React.FC = () => {
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
      // 1. Send Login HTTP Request to Express Backend
      const response = await API.post('/users/login', { email, password });
      
      // 2. Extract JWT token and user info
      const { token, user } = response.data.data;

      // 3. Update global AuthContext & trigger Socket.IO connection
      login(token, user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center h-screen bg-gray-900'>
      <Card className="w-full max-w-sm p-5 transition-all duration-300 ease-in-out hover:scale-105 border-slate-600 bg-gray-950/60 text-slate-100">
        
        <CardHeader className='gap-4'>
          <CardTitle className='text-3xl font-extrabold text-white'>DevFlow</CardTitle>
          <CardDescription className='text-md font-semibold text-slate-400'>
            Welcome back, please sign in to your account
          </CardDescription>
          <CardAction>
            <Button className='w-full text-blue-400 font-bold' variant="link">Sign Up</Button>
          </CardAction>
        </CardHeader>
        
        {/* Wrap BOTH CardContent and CardFooter inside the form */}
        <form onSubmit={handleSubmit}>
          <CardContent className='mt-4'>
            <div className="flex flex-col gap-3">
              
              {/* Error Message Alert */}
              {error && (
                <div className="p-3 text-xs rounded-lg bg-red-950/80 border border-red-800 text-red-300 font-medium">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div className="grid gap-1">
                <Label className='text-[15px] font-bold text-slate-300' htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Field */}
              <div className="grid gap-1 mt-2">
                <div className="flex items-center">
                  <Label className="text-slate-300 font-medium" htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="text-blue-400 font-semibold ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>

          {/* Submit Button Inside Form */}
          <CardFooter className="my-4 flex-col gap-2">
            <Button size="lg" type="submit" disabled={loading} className="w-full font-bold">
              {loading ?
                <LoaderIcon role="status" 
                    aria-label="Loading"
                    className="size-4 animate-spin"
                    />
              : "Login"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>   
  );
};


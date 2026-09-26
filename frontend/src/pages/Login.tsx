import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageSearch, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, "Email is missed").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().min(1, "Email is missed").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

export function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, clearErrors } = useForm<SignupValues>({
    resolver: async (data, context, options) => {
      // Dynamically resolve based on current state
      const schema = isLogin ? loginSchema : signupSchema;
      return zodResolver(schema)(data, context, options);
    },
    mode: 'onSubmit'
  });

  const onSubmit = async (data: SignupValues) => {
    setServerError(null);
    try {
      const endpoint = isLogin ? 'http://localhost:3000/auth/login' : 'http://localhost:3000/auth/signup';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Authentication failed');
      }

      if (isLogin) {
        // Save token and go to dashboard
        localStorage.setItem('stocksense_token', result.token);
        navigate('/dashboard');
      } else {
        // Switch to login on successful signup
        setIsLogin(true);
        reset();
      }
    } catch (err: any) {
      setServerError(err.message);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setServerError(null);
    clearErrors();
    reset({ email: '', password: '', name: '' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-900/[0.04] bg-[bottom_1px_center] z-0"></div>
      
      <Card className="w-full max-w-md z-10 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border-0 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
        <CardHeader className="space-y-1 text-center pb-8 pt-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            <PackageSearch className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">StockSense</CardTitle>
          <CardDescription className="text-slate-500">
            {isLogin ? 'Enter your credentials to access the inventory.' : 'Create an account to manage your stock.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm font-medium text-center">
              {serverError}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register('name')} placeholder="John Doe" className="bg-white/50 dark:bg-slate-950/50" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} placeholder="m@example.com" className="bg-white/50 dark:bg-slate-950/50" />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <Button variant="link" className="p-0 h-auto text-xs text-blue-600 hover:text-blue-500" type="button">
                    Forgot password? (OTP)
                  </Button>
                )}
              </div>
              <Input id="password" type="password" {...register('password')} className="bg-white/50 dark:bg-slate-950/50" />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 mt-6">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center border-t border-slate-100 dark:border-slate-800 pt-6 pb-8">
          <p className="text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={toggleMode}
              className="text-blue-600 hover:underline font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PackageSearch, Loader2, Mail, KeyRound } from 'lucide-react';
import { authApi } from '@/api/auth';

// ── Schemas ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['manager', 'staff']),
});

const otpRequestSchema = z.object({ email: z.string().email() });

const otpResetSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;
type OtpRequestValues = z.infer<typeof otpRequestSchema>;
type OtpResetValues = z.infer<typeof otpResetSchema>;

type Mode = 'login' | 'signup' | 'otp-request' | 'otp-reset';

// ── Component ─────────────────────────────────────────────────────────────────

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const [mode, setMode] = useState<Mode>('login');
  const [serverError, setServerError] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState('');

  // Single form instance — schema switches dynamically based on mode
  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema), mode: 'onSubmit' });
  const signupForm = useForm<SignupValues>({ resolver: zodResolver(signupSchema), mode: 'onSubmit' });
  const otpRequestForm = useForm<OtpRequestValues>({ resolver: zodResolver(otpRequestSchema) });
  const otpResetForm = useForm<OtpResetValues>({ resolver: zodResolver(otpResetSchema) });

  const clearError = () => setServerError(null);

  // ── Login ──────────────────────────────────────────────────────────────────
  const onLogin = async (data: LoginValues) => {
    clearError();
    try {
      const result = await authApi.login(data.email, data.password);
      localStorage.setItem('stocksense_token', result.access_token); // ✅ fixed key
      navigate(from, { replace: true });
    } catch (err: any) {
      setServerError(typeof err === 'string' ? err : 'Invalid email or password');
    }
  };

  // ── Signup ─────────────────────────────────────────────────────────────────
  const onSignup = async (data: SignupValues) => {
    clearError();
    try {
      const result = await authApi.signup(data.name, data.email, data.password, data.role);
      localStorage.setItem('stocksense_token', result.access_token);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setServerError(typeof err === 'string' ? err : 'Signup failed');
    }
  };

  // ── OTP Request ────────────────────────────────────────────────────────────
  const onOtpRequest = async (data: OtpRequestValues) => {
    clearError();
    try {
      await authApi.requestOtp(data.email);
      setOtpEmail(data.email);
      otpResetForm.setValue('email', data.email);
      setMode('otp-reset');
    } catch (err: any) {
      setServerError(typeof err === 'string' ? err : 'Failed to send OTP');
    }
  };

  // ── OTP Reset ──────────────────────────────────────────────────────────────
  const onOtpReset = async (data: OtpResetValues) => {
    clearError();
    try {
      await authApi.resetPassword(data.email, data.otp, data.new_password);
      setMode('login');
    } catch (err: any) {
      setServerError(typeof err === 'string' ? err : 'Invalid or expired OTP');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-900/[0.04] bg-[bottom_1px_center] z-0" />

      <Card className="w-full max-w-md z-10 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border-0 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
        <CardHeader className="space-y-1 text-center pb-6 pt-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
            {mode === 'otp-request' || mode === 'otp-reset'
              ? <KeyRound className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              : <PackageSearch className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            }
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">StockSense</CardTitle>
          <CardDescription className="text-slate-500">
            {mode === 'login' && 'Enter your credentials to access the inventory.'}
            {mode === 'signup' && 'Create an account to manage your stock.'}
            {mode === 'otp-request' && 'Enter your email to receive a reset OTP.'}
            {mode === 'otp-reset' && `Enter the OTP sent to ${otpEmail}.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm font-medium text-center">
              {serverError}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" {...loginForm.register('email')} placeholder="m@example.com" className="bg-white/50 dark:bg-slate-950/50" />
                {loginForm.formState.errors.email && <p className="text-xs text-red-500">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <button type="button" onClick={() => { clearError(); setMode('otp-request'); }} className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </button>
                </div>
                <Input id="login-password" type="password" {...loginForm.register('password')} className="bg-white/50 dark:bg-slate-950/50" />
                {loginForm.formState.errors.password && <p className="text-xs text-red-500">{loginForm.formState.errors.password.message}</p>}
              </div>
              <Button type="submit" disabled={loginForm.formState.isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 mt-6">
                {loginForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Sign In
              </Button>
            </form>
          )}

          {/* ── SIGNUP FORM ── */}
          {mode === 'signup' && (
            <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input id="signup-name" {...signupForm.register('name')} placeholder="John Doe" className="bg-white/50 dark:bg-slate-950/50" />
                {signupForm.formState.errors.name && <p className="text-xs text-red-500">{signupForm.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" {...signupForm.register('email')} placeholder="m@example.com" className="bg-white/50 dark:bg-slate-950/50" />
                {signupForm.formState.errors.email && <p className="text-xs text-red-500">{signupForm.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" {...signupForm.register('password')} className="bg-white/50 dark:bg-slate-950/50" />
                {signupForm.formState.errors.password && <p className="text-xs text-red-500">{signupForm.formState.errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select onValueChange={(v) => signupForm.setValue('role', v as 'manager' | 'staff')} defaultValue="staff">
                  <SelectTrigger className="bg-white/50 dark:bg-slate-950/50">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Warehouse Staff</SelectItem>
                    <SelectItem value="manager">Inventory Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={signupForm.formState.isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 mt-6">
                {signupForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Account
              </Button>
            </form>
          )}

          {/* ── OTP REQUEST FORM ── */}
          {mode === 'otp-request' && (
            <form onSubmit={otpRequestForm.handleSubmit(onOtpRequest)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-email">Email Address</Label>
                <Input id="otp-email" type="email" {...otpRequestForm.register('email')} placeholder="m@example.com" className="bg-white/50 dark:bg-slate-950/50" />
              </div>
              <Button type="submit" disabled={otpRequestForm.formState.isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">
                {otpRequestForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                Send OTP
              </Button>
            </form>
          )}

          {/* ── OTP RESET FORM ── */}
          {mode === 'otp-reset' && (
            <form onSubmit={otpResetForm.handleSubmit(onOtpReset)} className="space-y-4">
              <input type="hidden" {...otpResetForm.register('email')} />
              <div className="space-y-2">
                <Label htmlFor="otp-code">6-Digit OTP</Label>
                <Input id="otp-code" {...otpResetForm.register('otp')} placeholder="123456" maxLength={6} className="bg-white/50 dark:bg-slate-950/50 tracking-widest text-center text-lg" />
                {otpResetForm.formState.errors.otp && <p className="text-xs text-red-500">{otpResetForm.formState.errors.otp.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" {...otpResetForm.register('new_password')} className="bg-white/50 dark:bg-slate-950/50" />
                {otpResetForm.formState.errors.new_password && <p className="text-xs text-red-500">{otpResetForm.formState.errors.new_password.message}</p>}
              </div>
              <Button type="submit" disabled={otpResetForm.formState.isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4">
                {otpResetForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col items-center justify-center border-t border-slate-100 dark:border-slate-800 pt-6 pb-8 gap-2">
          {(mode === 'login' || mode === 'signup') && (
            <p className="text-sm text-slate-500">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button type="button" onClick={() => { clearError(); setMode(mode === 'login' ? 'signup' : 'login'); }} className="text-blue-600 hover:underline font-medium">
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
          {(mode === 'otp-request' || mode === 'otp-reset') && (
            <button type="button" onClick={() => { clearError(); setMode('login'); }} className="text-sm text-slate-500 hover:text-blue-600 transition-colors">
              ← Back to login
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

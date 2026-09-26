import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Shield, Calendar, Loader2, Edit2, Check, X } from 'lucide-react';
import { authApi, type UserRead } from '@/api/auth';

export function Profile() {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    authApi.getProfile()
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const initials = user
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center text-slate-400 py-16">
        Failed to load profile. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
        <p className="text-slate-500 mt-1">Manage your account details and preferences.</p>
      </div>

      {/* Profile Card */}
      <Card className="border-0 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] overflow-hidden">
        {/* Cover gradient */}
        <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>
        <CardContent className="px-6 pb-6">
          {/* Avatar overlapping cover */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-slate-950 shadow-lg">
              <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=3b82f6`} />
              <AvatarFallback className="text-xl bg-blue-600 text-white">{initials}</AvatarFallback>
            </Avatar>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
              user.role === 'manager'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            }`}>
              {user.role}
            </span>
          </div>

          <h3 className="text-2xl font-bold">{user.name}</h3>
          <p className="text-slate-500 text-sm">{user.email}</p>
        </CardContent>
      </Card>

      {/* Details card */}
      <Card className="border-0 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <CardHeader className="py-4">
          <CardTitle className="text-base font-semibold">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Full Name</p>
                <p className="text-sm font-medium mt-0.5">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Mail className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Email Address</p>
                <p className="text-sm font-medium mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Role</p>
                <p className="text-sm font-medium mt-0.5 capitalize">{user.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Member Since</p>
                <p className="text-sm font-medium mt-0.5">
                  {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
            <div className={`w-2.5 h-2.5 rounded-full ${user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Account status: <strong className={user.is_active ? 'text-emerald-600' : 'text-slate-500'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </strong>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowRightLeft,
  History,
  Settings,
  User,
  LogOut,
  Bell,
  ArrowDownToLine,
  ArrowUpFromLine,
  PenTool,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModeToggle } from '@/components/mode-toggle';

export function DashboardLayout() {
  const navigate = useNavigate();
  const [opsExpanded, setOpsExpanded] = React.useState(true);

  const handleLogout = () => {
    localStorage.removeItem('stocksense_token');
    navigate('/login');
  };

  const mainNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/products', icon: Package },
  ];

  const opsNavItems = [
    { name: 'Receipts', path: '/receipts', icon: ArrowDownToLine, color: 'text-emerald-500' },
    { name: 'Deliveries', path: '/deliveries', icon: ArrowUpFromLine, color: 'text-orange-500' },
    { name: 'Transfers', path: '/transfers', icon: ArrowRightLeft, color: 'text-purple-500' },
    { name: 'Adjustments', path: '/adjustments', icon: PenTool, color: 'text-blue-500' },
  ];

  const bottomNavItems = [
    { name: 'Move History', path: '/history', icon: History },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50/50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] flex flex-col z-20">
        {/* Logo */}
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            StockSense
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">Inventory Management</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
          {/* Main nav */}
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 font-medium'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            );
          })}

          {/* Operations section */}
          <div className="pt-2">
            <button
              onClick={() => setOpsExpanded((p) => !p)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-semibold uppercase tracking-wider"
            >
              <span>Operations</span>
              {opsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {opsExpanded && (
              <div className="mt-1 space-y-0.5 pl-2">
                {opsNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                          isActive
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 font-medium'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                        }`
                      }
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom nav items */}
          <div className="pt-2 space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 font-medium'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Profile + Logout */}
        <div className="p-4 relative before:absolute before:top-0 before:left-4 before:right-4 before:h-[1px] before:bg-gradient-to-r before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-all text-sm ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 font-medium'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`
            }
          >
            <User className="w-4 h-4 flex-shrink-0" />
            <span>My Profile</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center text-sm text-slate-500">
            <span className="font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs">
              StockSense IMS v1.0
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ModeToggle />
            <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </Button>
            <NavLink to="/profile">
              <Avatar className="h-8 w-8 ring-2 ring-blue-100 cursor-pointer hover:ring-blue-300 transition-all">
                <AvatarImage src="https://api.dicebear.com/9.x/initials/svg?seed=User&backgroundColor=3b82f6" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

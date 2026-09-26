import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  AlertTriangle, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  ArrowRightLeft,
  TrendingUp
} from 'lucide-react';

export function Dashboard() {
  const kpis = [
    { title: 'Total Products', value: '2,405', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Low / Out of Stock', value: '48', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    { title: 'Pending Receipts', value: '12', icon: ArrowDownToLine, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Pending Deliveries', value: '34', icon: ArrowUpFromLine, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { title: 'Internal Transfers', value: '8', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ];

  const recentActivities = [
    { type: 'Receipt', title: 'Received 100 kg Steel', time: '2 hours ago', status: 'Done' },
    { type: 'Transfer', title: 'Main Store → Production Rack', time: '4 hours ago', status: 'Ready' },
    { type: 'Delivery', title: 'Sales order #1042 - 20 steel frames', time: '5 hours ago', status: 'Waiting' },
    { type: 'Adjustment', title: 'Damaged item write-off - 3 kg steel', time: 'Yesterday', status: 'Done' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Inventory Snapshot</h2>
        <p className="text-slate-500 mt-2">Here's what's happening in your warehouses today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-0 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">{kpi.title}</CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center text-xs text-emerald-600 mt-1 font-medium">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>+2% from last week</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] border-0">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivities.map((activity, i) => (
                <div key={i} className="flex items-center group">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-4 group-hover:scale-150 transition-transform"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                    <p className="text-sm text-slate-500">{activity.type} • {activity.time}</p>
                  </div>
                  <div className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    activity.status === 'Done' ? 'bg-emerald-100 text-emerald-700' :
                    activity.status === 'Ready' ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {activity.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] border-0 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium">Stock Status is Healthy</h3>
            <p className="text-sm text-slate-500 max-w-[250px] mx-auto">
              Your inventory levels are optimal across 3 warehouses. No urgent actions required today.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRightLeft,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { stockApi, subscribeDashboard, type DashboardKPIs } from '@/api/stock';

// ── KPI card definitions ──────────────────────────────────────────────────────

function buildKpis(data: DashboardKPIs) {
  return [
    {
      title: 'Total Products',
      value: data.total_products.toLocaleString(),
      icon: Package,
      color: 'text-blue-600',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Low / Out of Stock',
      value: (data.low_stock_count + data.out_of_stock_count).toLocaleString(),
      icon: AlertTriangle,
      color: data.low_stock_count + data.out_of_stock_count > 0 ? 'text-red-600' : 'text-emerald-600',
      bg: data.low_stock_count + data.out_of_stock_count > 0
        ? 'bg-red-100 dark:bg-red-900/30'
        : 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Pending Receipts',
      value: data.pending_receipts.toLocaleString(),
      icon: ArrowDownToLine,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      title: 'Pending Deliveries',
      value: data.pending_deliveries.toLocaleString(),
      icon: ArrowUpFromLine,
      color: 'text-orange-600',
      bg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      title: 'Internal Transfers',
      value: data.scheduled_transfers.toLocaleString(),
      icon: ArrowRightLeft,
      color: 'text-purple-600',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initial REST fetch
  useEffect(() => {
    stockApi
      .dashboard()
      .then(setKpis)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // SSE live updates
  useEffect(() => {
    const cleanup = subscribeDashboard(
      (data) => {
        setKpis(data);
        setIsLive(true);
      },
      () => setIsLive(false)
    );
    cleanupRef.current = cleanup;
    return cleanup;
  }, []);

  const kpiCards = kpis ? buildKpis(kpis) : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventory Snapshot</h2>
          <p className="text-slate-500 mt-2">Here's what's happening in your warehouses today.</p>
        </div>
        {/* Live SSE indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
          isLive
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800'
            : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'
        }`}>
          {isLive
            ? <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE</>
            : <><WifiOff className="w-3 h-3" /> OFFLINE</>
          }
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {kpiCards.map((kpi, i) => {
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
                  <div className="flex items-center text-xs text-slate-400 mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    <span>
                      {kpis?.last_updated
                        ? `Updated ${new Date(kpis.last_updated).toLocaleTimeString()}`
                        : 'Live'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent Movements + Stock Health */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Move History
              <span className="text-xs font-normal text-slate-400">— last 24h</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32 text-slate-400">
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-700 dark:text-slate-200">
                  {kpis?.recent_movements ?? '—'}
                </div>
                <p className="text-sm mt-1">movements in the last 24h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] border-0 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
          <div className="text-center space-y-4">
            <div className={`inline-flex p-4 rounded-full ${
              (kpis?.out_of_stock_count ?? 0) > 0
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
            }`}>
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium">
              {(kpis?.out_of_stock_count ?? 0) > 0
                ? `${kpis!.out_of_stock_count} product(s) out of stock`
                : 'Stock Status is Healthy'}
            </h3>
            <p className="text-sm text-slate-500 max-w-[250px] mx-auto">
              {(kpis?.low_stock_count ?? 0) > 0
                ? `${kpis!.low_stock_count} product(s) are running low and need restocking.`
                : 'Your inventory levels are optimal. No urgent actions required.'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

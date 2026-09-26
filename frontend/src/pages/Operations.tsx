import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, PenTool, ChevronRight } from 'lucide-react';

const OPERATIONS = [
  {
    id: 'receipts',
    name: 'Receipts',
    description: 'Receive incoming stock from vendors. Each validated receipt automatically increases your stock levels.',
    icon: ArrowDownToLine,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    accent: 'border-emerald-200 dark:border-emerald-800',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20',
    path: '/receipts',
    example: 'Receive 100 kg Steel → Stock +100',
  },
  {
    id: 'deliveries',
    name: 'Delivery Orders',
    description: 'Ship outgoing stock to customers. Validating a delivery automatically deducts from inventory.',
    icon: ArrowUpFromLine,
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    accent: 'border-orange-200 dark:border-orange-800',
    buttonBg: 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/20',
    path: '/deliveries',
    example: 'Ship 20 units Chairs → Stock −20',
  },
  {
    id: 'transfers',
    name: 'Internal Transfers',
    description: 'Move stock between locations within the warehouse. Total stock stays the same, but location is updated.',
    icon: ArrowRightLeft,
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    accent: 'border-purple-200 dark:border-purple-800',
    buttonBg: 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20',
    path: '/transfers',
    example: 'Main Store → Production Rack',
  },
  {
    id: 'adjustments',
    name: 'Inventory Adjustments',
    description: 'Fix mismatches between recorded and physical counts. Generates a ledger entry for every discrepancy.',
    icon: PenTool,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    accent: 'border-blue-200 dark:border-blue-800',
    buttonBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20',
    path: '/adjustments',
    example: '3 kg Steel damaged → Stock −3',
  },
];

export function Operations() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Operations</h2>
        <p className="text-slate-500 mt-1">
          All inventory movements are tracked in real-time and logged to the stock ledger.
        </p>
      </div>

      {/* Flow diagram hint */}
      <div className="flex flex-wrap items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-500">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Stock Flow:</span>
        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">Receive Goods</span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium">Internal Transfer</span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium">Deliver to Customer</span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium">Adjust if Needed</span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
        <span className="font-medium text-slate-600 dark:text-slate-400">Stock Ledger ✓</span>
      </div>

      {/* Operation Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {OPERATIONS.map((op) => {
          const Icon = op.icon;
          return (
            <Card
              key={op.id}
              className={`group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)] cursor-pointer overflow-hidden`}
              onClick={() => navigate(op.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${op.bg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${op.color}`} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 group-hover:translate-x-1 transition-all duration-200 mt-1" />
                </div>
                <CardTitle className="mt-4 text-xl">{op.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500 leading-relaxed">{op.description}</p>

                {/* Example chip */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
                  <span className="font-medium">Example:</span>
                  <span>{op.example}</span>
                </div>

                <Button
                  className={`w-full shadow-lg ${op.buttonBg} mt-2`}
                  onClick={(e) => { e.stopPropagation(); navigate(op.path); }}
                >
                  Open {op.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

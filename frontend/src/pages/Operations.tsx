import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, PenTool, Plus } from 'lucide-react';

export function Operations() {
  const operations = [
    { id: 'receipts', name: 'Receipts', description: 'Incoming stock from vendors', icon: ArrowDownToLine, color: 'text-emerald-600', bg: 'bg-emerald-100', count: 12 },
    { id: 'deliveries', name: 'Delivery Orders', description: 'Outgoing stock to customers', icon: ArrowUpFromLine, color: 'text-orange-600', bg: 'bg-orange-100', count: 34 },
    { id: 'transfers', name: 'Internal Transfers', description: 'Move stock between locations', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-100', count: 8 },
    { id: 'adjustments', name: 'Inventory Adjustments', description: 'Fix mismatches in physical count', icon: PenTool, color: 'text-blue-600', bg: 'bg-blue-100', count: 2 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Operations</h2>
          <p className="text-slate-500 mt-1">Manage all inventory movements and adjustments.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {operations.map((op) => {
          const Icon = op.icon;
          return (
            <Card key={op.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)] cursor-pointer overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-slate-100 dark:to-slate-900 rounded-bl-full -z-10 opacity-50 group-hover:scale-110 transition-transform"></div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-xl ${op.bg} dark:bg-opacity-20`}>
                    <Icon className={`w-6 h-6 ${op.color}`} />
                  </div>
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-bold">
                    {op.count}
                  </span>
                </div>
                <CardTitle className="mt-4 text-xl">{op.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 mb-6">{op.description}</p>
                <Button variant="secondary" className="w-full group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors">
                  View {op.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Action Section */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
            <Plus className="w-4 h-4 mr-2" /> New Receipt
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20">
            <Plus className="w-4 h-4 mr-2" /> New Delivery
          </Button>
          <Button variant="outline" className="border-slate-300">
            <ArrowRightLeft className="w-4 h-4 mr-2" /> Quick Transfer
          </Button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, PenTool, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function StockLedger() {
  const history = [
    { id: '1', ref: 'WH/IN/0004', product: 'Steel Rods', qty: '+100', type: 'Receipt', location: 'Vendors → Main Store', date: '2026-09-26 10:30', status: 'Done' },
    { id: '2', ref: 'WH/INT/0023', product: 'Steel Rods', qty: '100', type: 'Transfer', location: 'Main Store → Prod Rack', date: '2026-09-26 11:15', status: 'Done' },
    { id: '3', ref: 'WH/OUT/0019', product: 'Steel Frames', qty: '-20', type: 'Delivery', location: 'Main Store → Customers', date: '2026-09-25 14:00', status: 'Done' },
    { id: '4', ref: 'WH/ADJ/0002', product: 'Steel Rods', qty: '-3', type: 'Adjustment', location: 'Prod Rack', date: '2026-09-24 09:45', status: 'Done' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'Receipt': return <ArrowDownToLine className="w-4 h-4 text-emerald-600" />;
      case 'Delivery': return <ArrowUpFromLine className="w-4 h-4 text-orange-600" />;
      case 'Transfer': return <ArrowRightLeft className="w-4 h-4 text-purple-600" />;
      case 'Adjustment': return <PenTool className="w-4 h-4 text-blue-600" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Stock Ledger</h2>
        <p className="text-slate-500 mt-1">Detailed history of all inventory movements.</p>
      </div>

      <Card className="border-0 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <CardHeader className="py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Move History</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input className="pl-9 bg-slate-50 dark:bg-slate-900 border-none" placeholder="Search by reference, product..." />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Locations</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                  <TableCell className="font-medium text-blue-600">{row.ref}</TableCell>
                  <TableCell className="font-medium">{row.product}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getIcon(row.type)}
                      <span className="text-sm text-slate-600 dark:text-slate-300">{row.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{row.location}</TableCell>
                  <TableCell className={`text-right font-bold ${
                    row.qty.startsWith('+') ? 'text-emerald-600' : 
                    row.qty.startsWith('-') ? 'text-orange-600' : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {row.qty}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

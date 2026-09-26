import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, PenTool, Search, Loader2 } from 'lucide-react';
import { stockApi, type LedgerEntry } from '@/api/stock';

const MOVEMENT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  receipt:    { label: 'Receipt',    icon: <ArrowDownToLine className="w-4 h-4 text-emerald-600" />, color: 'text-emerald-600' },
  delivery:   { label: 'Delivery',   icon: <ArrowUpFromLine className="w-4 h-4 text-orange-600" />,  color: 'text-orange-600'  },
  transfer:   { label: 'Transfer',   icon: <ArrowRightLeft className="w-4 h-4 text-purple-600" />,   color: 'text-purple-600'  },
  adjustment: { label: 'Adjustment', icon: <PenTool className="w-4 h-4 text-blue-600" />,            color: 'text-blue-600'    },
};

export function StockLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [movementType, setMovementType] = useState<string>('');
  const [page] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    stockApi
      .ledger({
        movement_type: movementType || undefined,
        page,
        limit: 50,
      })
      .then((res) => {
        setEntries(res.items);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [movementType, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Determine qty display: receipts show +qty, deliveries show -qty, transfers neutral
  const formatQty = (entry: LedgerEntry) => {
    if (entry.movement_type === 'receipt') return `+${entry.qty}`;
    if (entry.movement_type === 'delivery') return `-${entry.qty}`;
    if (entry.movement_type === 'adjustment') {
      // If from_location is null, it was a gain; if to_location is null, it was a loss
      return entry.from_location_id ? `-${entry.qty}` : `+${entry.qty}`;
    }
    return String(entry.qty); // transfer: neutral
  };

  const qtyColor = (entry: LedgerEntry) => {
    const fmt = formatQty(entry);
    if (fmt.startsWith('+')) return 'text-emerald-600';
    if (fmt.startsWith('-')) return 'text-orange-600';
    return 'text-slate-600 dark:text-slate-300';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Stock Ledger</h2>
        <p className="text-slate-500 mt-1">
          {loading ? 'Loading...' : `${total} total movements`}
        </p>
      </div>

      <Card className="border-0 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <CardHeader className="py-4">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Movement type filter */}
            <Select value={movementType} onValueChange={(v) => setMovementType(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-44 bg-slate-50 dark:bg-slate-900 border-none">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="receipt">Receipts</SelectItem>
                <SelectItem value="delivery">Deliveries</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
                <SelectItem value="adjustment">Adjustments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading ledger...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-12">
                      No movements found.
                    </TableCell>
                  </TableRow>
                ) : entries.map((row) => {
                  const meta = MOVEMENT_META[row.movement_type];
                  return (
                    <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <TableCell className="font-medium text-blue-600 font-mono text-sm">
                        {row.reference_ref}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {meta.icon}
                          <span className="text-sm text-slate-600 dark:text-slate-300">{meta.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {row.from_location_id ? row.from_location_id.slice(0, 8) + '…' : <span className="text-slate-300">—</span>}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {row.to_location_id ? row.to_location_id.slice(0, 8) + '…' : <span className="text-slate-300">—</span>}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${qtyColor(row)}`}>
                        {formatQty(row)}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(row.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

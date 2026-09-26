import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowDownToLine, Plus, Loader2, CheckCircle2, XCircle, Clock, FileText, Trash2,
} from 'lucide-react';
import { receiptsApi, type Receipt, type OperationStatus } from '@/api/operations';
import { productsApi, type ProductRead } from '@/api/products';
import { warehousesApi, type Location } from '@/api/warehouses';

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<OperationStatus, string> = {
  draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  waiting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ready: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  canceled: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_ICONS: Record<OperationStatus, React.ReactNode> = {
  draft: <FileText className="w-3 h-3" />,
  waiting: <Clock className="w-3 h-3" />,
  ready: <Clock className="w-3 h-3" />,
  done: <CheckCircle2 className="w-3 h-3" />,
  canceled: <XCircle className="w-3 h-3" />,
};

function StatusBadge({ status }: { status: OperationStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[status]}`}>
      {STATUS_ICONS[status]}
      {status}
    </span>
  );
}

// ── Line item for the create form ─────────────────────────────────────────────

interface FormLine {
  product_id: string;
  expected_qty: number;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Receipts() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductRead[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Form state
  const [destLocation, setDestLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<FormLine[]>([{ product_id: '', expected_qty: 1 }]);

  const load = useCallback(() => {
    setLoading(true);
    receiptsApi
      .list({ status: (statusFilter as OperationStatus) || undefined, limit: 50 })
      .then((res) => { setReceipts(res.items); setTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    productsApi.list({ limit: 200 }).then((r) => setProducts(r.items)).catch(console.error);
    warehousesApi.listLocations().then(setLocations).catch(console.error);
  }, []);

  const addLine = () => setLines((prev) => [...prev, { product_id: '', expected_qty: 1 }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof FormLine, value: string | number) =>
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const handleCreate = async () => {
    if (!destLocation) return alert('Select a destination location');
    const validLines = lines.filter((l) => l.product_id && l.expected_qty > 0);
    if (validLines.length === 0) return alert('Add at least one product line');

    setSubmitting(true);
    try {
      const created = await receiptsApi.create({
        destination_location_id: destLocation,
        notes: notes || undefined,
        lines: validLines,
      });
      setReceipts((prev) => [created, ...prev]);
      setIsOpen(false);
      setLines([{ product_id: '', expected_qty: 1 }]);
      setDestLocation('');
      setNotes('');
    } catch (err: any) {
      alert(typeof err === 'string' ? err : 'Failed to create receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this receipt?')) return;
    try {
      const updated = await receiptsApi.cancel(id);
      setReceipts((prev) => prev.map((r) => r.id === id ? updated : r));
    } catch (err: any) {
      alert(typeof err === 'string' ? err : 'Failed to cancel receipt');
    }
  };

  const getProductName = (id: string) => products.find((p) => p.id === id)?.name ?? id.slice(0, 8) + '…';
  const getLocationName = (id: string) => locations.find((l) => l.id === id)?.name ?? id.slice(0, 8) + '…';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <ArrowDownToLine className="w-6 h-6 text-emerald-600" />
            </span>
            Receipts
          </h2>
          <p className="text-slate-500 mt-1">
            {loading ? 'Loading…' : `${total} incoming stock receipts`}
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
              <Plus className="w-4 h-4 mr-2" /> New Receipt
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Receipt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Destination Location *</Label>
                <Select value={destLocation} onValueChange={setDestLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="r-notes">Notes (optional)</Label>
                <Input id="r-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes…" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Products</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>
                    <Plus className="w-3 h-3 mr-1" /> Add Line
                  </Button>
                </div>
                {lines.map((line, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <Select value={line.product_id} onValueChange={(v) => updateLine(i, 'product_id', v)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={line.expected_qty}
                      onChange={(e) => updateLine(i, 'expected_qty', parseFloat(e.target.value) || 0)}
                      className="w-24"
                      placeholder="Qty"
                    />
                    {lines.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(i)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button onClick={handleCreate} disabled={submitting} className="w-full mt-2">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Create Receipt
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-44 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading receipts…
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Lines</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-16">
                      No receipts yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : receipts.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <TableCell className="font-mono text-sm font-semibold text-blue-600">{r.reference}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 text-sm">
                      {getLocationName(r.destination_location_id)}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{r.lines.length} line(s)</TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status !== 'done' && r.status !== 'canceled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleCancel(r.id)}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

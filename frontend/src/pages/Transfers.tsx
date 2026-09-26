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
  ArrowRightLeft, Plus, Loader2, CheckCircle2, XCircle, Clock, FileText, Trash2,
} from 'lucide-react';
import { transfersApi, type Transfer, type OperationStatus } from '@/api/operations';
import { productsApi, type ProductRead } from '@/api/products';
import { warehousesApi, type Location } from '@/api/warehouses';

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

interface FormLine { product_id: string; qty: number; }

export function Transfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductRead[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [fromLoc, setFromLoc] = useState('');
  const [toLoc, setToLoc] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<FormLine[]>([{ product_id: '', qty: 1 }]);

  const load = useCallback(() => {
    setLoading(true);
    transfersApi
      .list({ status: (statusFilter as OperationStatus) || undefined, limit: 50 })
      .then((res) => { setTransfers(res.items); setTotal(res.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    productsApi.list({ limit: 200 }).then((r) => setProducts(r.items)).catch(console.error);
    warehousesApi.listLocations().then(setLocations).catch(console.error);
  }, []);

  const addLine = () => setLines((prev) => [...prev, { product_id: '', qty: 1 }]);
  const removeLine = (i: number) => setLines((prev) => prev.filter((_, idx) => idx !== i));
  const updateLine = (i: number, field: keyof FormLine, value: string | number) =>
    setLines((prev) => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));

  const handleCreate = async () => {
    if (!fromLoc || !toLoc) return alert('Select both source and destination locations');
    if (fromLoc === toLoc) return alert('Source and destination must be different');
    const validLines = lines.filter((l) => l.product_id && l.qty > 0);
    if (validLines.length === 0) return alert('Add at least one product line');
    setSubmitting(true);
    try {
      const created = await transfersApi.create({
        from_location_id: fromLoc,
        to_location_id: toLoc,
        notes: notes || undefined,
        lines: validLines,
      });
      setTransfers((prev) => [created, ...prev]);
      setIsOpen(false);
      setLines([{ product_id: '', qty: 1 }]);
      setFromLoc(''); setToLoc(''); setNotes('');
    } catch (err: any) {
      alert(typeof err === 'string' ? err : 'Failed to create transfer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidate = async (id: string) => {
    if (!confirm('Validate this transfer? Stock will move between locations.')) return;
    try {
      const updated = await transfersApi.validate(id);
      setTransfers((prev) => prev.map((t) => t.id === id ? updated : t));
    } catch (err: any) { alert(typeof err === 'string' ? err : 'Validation failed'); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this transfer?')) return;
    try {
      const updated = await transfersApi.cancel(id);
      setTransfers((prev) => prev.map((t) => t.id === id ? updated : t));
    } catch (err: any) { alert(typeof err === 'string' ? err : 'Cancel failed'); }
  };

  const getLocationName = (id: string) => locations.find((l) => l.id === id)?.name ?? id.slice(0, 8) + '…';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <ArrowRightLeft className="w-6 h-6 text-purple-600" />
            </span>
            Internal Transfers
          </h2>
          <p className="text-slate-500 mt-1">{loading ? 'Loading…' : `${total} stock transfers`}</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20">
              <Plus className="w-4 h-4 mr-2" /> New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Internal Transfer</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Location *</Label>
                  <Select value={fromLoc} onValueChange={setFromLoc}>
                    <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>To Location *</Label>
                  <Select value={toLoc} onValueChange={setToLoc}>
                    <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes…" />
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
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number" min={0.01} step={0.01}
                      value={line.qty}
                      onChange={(e) => updateLine(i, 'qty', parseFloat(e.target.value) || 0)}
                      className="w-24" placeholder="Qty"
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
                Create Transfer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading transfers…
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead>Lines</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-16">
                      No transfers yet. Create one to move stock between locations.
                    </TableCell>
                  </TableRow>
                ) : transfers.map((t) => (
                  <TableRow key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <TableCell className="font-mono text-sm font-semibold text-purple-600">{t.reference}</TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 text-sm">
                      <span className="inline-flex items-center gap-1.5">
                        {getLocationName(t.from_location_id)}
                        <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                        {getLocationName(t.to_location_id)}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{t.lines.length} line(s)</TableCell>
                    <TableCell className="text-slate-500 text-sm">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {t.status === 'draft' && (
                        <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7" onClick={() => handleValidate(t.id)}>
                          Validate
                        </Button>
                      )}
                      {t.status !== 'done' && t.status !== 'canceled' && (
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs h-7" onClick={() => handleCancel(t.id)}>
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

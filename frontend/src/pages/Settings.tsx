import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Warehouse, MapPin, Plus, Loader2, Building2, ChevronRight } from 'lucide-react';
import { warehousesApi, type Warehouse as WarehouseType, type Location } from '@/api/warehouses';

export function Settings() {
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'warehouses' | 'locations'>('warehouses');

  // Warehouse form
  const [wOpen, setWOpen] = useState(false);
  const [wName, setWName] = useState('');
  const [wCode, setWCode] = useState('');
  const [wAddress, setWAddress] = useState('');
  const [wSubmitting, setWSubmitting] = useState(false);

  // Location form
  const [lOpen, setLOpen] = useState(false);
  const [lName, setLName] = useState('');
  const [lWarehouse, setLWarehouse] = useState('');
  const [lType, setLType] = useState('internal');
  const [lSubmitting, setLSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      warehousesApi.list().catch(() => []),
      warehousesApi.listLocations().catch(() => []),
    ]).then(([w, l]) => {
      setWarehouses(w);
      setLocations(l);
    }).finally(() => setLoading(false));
  }, []);

  const handleCreateWarehouse = async () => {
    if (!wName || !wCode) return alert('Name and code are required');
    setWSubmitting(true);
    try {
      const created = await warehousesApi.create({ name: wName, code: wCode, address: wAddress || undefined });
      setWarehouses((prev) => [created, ...prev]);
      setWOpen(false);
      setWName(''); setWCode(''); setWAddress('');
    } catch (err: any) {
      alert(typeof err === 'string' ? err : 'Failed to create warehouse');
    } finally {
      setWSubmitting(false);
    }
  };

  const handleCreateLocation = async () => {
    if (!lName || !lWarehouse) return alert('Name and warehouse are required');
    setLSubmitting(true);
    try {
      const created = await warehousesApi.createLocation({ name: lName, warehouse_id: lWarehouse, location_type: lType });
      setLocations((prev) => [created, ...prev]);
      setLOpen(false);
      setLName(''); setLWarehouse(''); setLType('internal');
    } catch (err: any) {
      alert(typeof err === 'string' ? err : 'Failed to create location');
    } finally {
      setLSubmitting(false);
    }
  };

  const getWarehouseName = (id: string) => warehouses.find((w) => w.id === id)?.name ?? '—';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-slate-500 mt-1">Manage warehouses, locations, and system preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
        {(['warehouses', 'locations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'warehouses' ? (
              <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> Warehouses</span>
            ) : (
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Locations</span>
            )}
          </button>
        ))}
      </div>

      {/* Warehouses Tab */}
      {activeTab === 'warehouses' && (
        <Card className="border-0 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base font-semibold">Warehouses</CardTitle>
            <Dialog open={wOpen} onOpenChange={setWOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" /> Add Warehouse
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader><DialogTitle>New Warehouse</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={wName} onChange={(e) => setWName(e.target.value)} placeholder="e.g. Main Warehouse" />
                  </div>
                  <div className="space-y-2">
                    <Label>Code *</Label>
                    <Input value={wCode} onChange={(e) => setWCode(e.target.value.toUpperCase())} placeholder="e.g. WH01" maxLength={10} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={wAddress} onChange={(e) => setWAddress(e.target.value)} placeholder="Street, City…" />
                  </div>
                  <Button onClick={handleCreateWarehouse} disabled={wSubmitting} className="w-full">
                    {wSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Create Warehouse
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Locations</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-400 py-12">
                        No warehouses yet. Create one to get started.
                      </TableCell>
                    </TableRow>
                  ) : warehouses.map((w) => (
                    <TableRow key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <TableCell className="font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        {w.name}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-slate-500">{w.code}</TableCell>
                      <TableCell className="text-slate-500 text-sm">{w.address ?? '—'}</TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {locations.filter((l) => l.warehouse_id === w.id).length}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          w.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {w.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Locations Tab */}
      {activeTab === 'locations' && (
        <Card className="border-0 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base font-semibold">Locations</CardTitle>
            <Dialog open={lOpen} onOpenChange={setLOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" /> Add Location
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader><DialogTitle>New Location</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input value={lName} onChange={(e) => setLName(e.target.value)} placeholder="e.g. Rack A-1" />
                  </div>
                  <div className="space-y-2">
                    <Label>Warehouse *</Label>
                    <Select value={lWarehouse} onValueChange={setLWarehouse}>
                      <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w) => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={lType} onValueChange={setLType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="input">Input</SelectItem>
                        <SelectItem value="output">Output</SelectItem>
                        <SelectItem value="transit">Transit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateLocation} disabled={lSubmitting} className="w-full">
                    {lSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Create Location
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-400 py-12">
                        No locations yet. Create one above.
                      </TableCell>
                    </TableRow>
                  ) : locations.map((loc) => (
                    <TableRow key={loc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                      <TableCell className="font-medium flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {loc.name}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">{getWarehouseName(loc.warehouse_id)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium capitalize text-slate-600 dark:text-slate-300">
                          {loc.location_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          loc.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {loc.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

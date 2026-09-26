import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Loader2 } from 'lucide-react';
import { productsApi, type ProductRead, type ProductCategory, type UnitOfMeasure } from '@/api/products';

// ── Form schema — uses UUIDs not strings ──────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z.string().min(1, 'SKU is required'),
  category_id: z.string().optional(),
  uom_id: z.string().min(1, 'Unit of measure is required'),
  reorder_point: z.coerce.number().min(0).optional().default(0),
  initial_stock: z.coerce.number().min(0).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

// ── Component ─────────────────────────────────────────────────────────────────

export function Products() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<ProductRead[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { reorder_point: 0, initial_stock: 0 },
  });

  // Load categories and UOMs for the form dropdowns
  useEffect(() => {
    productsApi.categories().then(setCategories).catch(console.error);
    productsApi.uoms().then(setUoms).catch(console.error);
  }, []);

  // Load products with search + pagination
  const loadProducts = useCallback(() => {
    setLoading(true);
    productsApi
      .list({ search: search || undefined, page, limit: 20 })
      .then((res) => {
        setProducts(res.items);
        setTotal(res.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const onSubmit = async (data: ProductFormValues) => {
    setSubmitting(true);
    try {
      const created = await productsApi.create({
        name: data.name,
        sku: data.sku,
        category_id: data.category_id || undefined,
        uom_id: data.uom_id,
        reorder_point: data.reorder_point ?? 0,
        initial_stock: data.initial_stock && data.initial_stock > 0 ? data.initial_stock : undefined,
      });
      setProducts((prev) => [created, ...prev]);
      setIsOpen(false);
      reset();
    } catch (err: any) {
      alert(typeof err === 'string' ? err : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  // Find UOM abbreviation for display
  const getUomAbbr = (uomId: string) =>
    uoms.find((u) => u.id === uomId)?.abbreviation ?? '';

  const getCategoryName = (catId: string | null) =>
    catId ? (categories.find((c) => c.id === catId)?.name ?? '—') : '—';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-slate-500 mt-1">
            {loading ? 'Loading...' : `${total} products in catalog`}
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all">
              <Plus className="w-4 h-4 mr-2" /> New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="p-name">Product Name</Label>
                <Input id="p-name" {...register('name')} placeholder="e.g. Steel Rods" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="p-sku">SKU / Code</Label>
                  <Input id="p-sku" {...register('sku')} placeholder="ST-001" />
                  {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select onValueChange={(v) => setValue('category_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {categories.length === 0
                        ? <SelectItem value="_none" disabled>No categories yet</SelectItem>
                        : categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Unit of Measure</Label>
                  <Select onValueChange={(v) => setValue('uom_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select UOM" /></SelectTrigger>
                    <SelectContent>
                      {uoms.length === 0
                        ? <SelectItem value="_none" disabled>No UOMs yet</SelectItem>
                        : uoms.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.uom_id && <p className="text-xs text-red-500">{errors.uom_id.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-reorder">Reorder Point</Label>
                  <Input id="p-reorder" type="number" step="0.01" {...register('reorder_point')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-stock">Initial Stock (optional)</Label>
                <Input id="p-stock" type="number" step="0.01" {...register('initial_stock')} />
                <p className="text-xs text-slate-400">Requires a location to be selected — wire up later</p>
              </div>

              <Button type="submit" disabled={submitting} className="w-full mt-4">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <CardHeader className="py-4">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              className="pl-9 bg-slate-50 dark:bg-slate-900 border-none"
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading products...
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                <TableRow>
                  <TableHead className="font-medium">Product</TableHead>
                  <TableHead className="font-medium">SKU</TableHead>
                  <TableHead className="font-medium">Category</TableHead>
                  <TableHead className="font-medium">UOM</TableHead>
                  <TableHead className="font-medium text-right">Reorder Point</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400 py-12">
                      No products found. Create one above.
                    </TableCell>
                  </TableRow>
                ) : products.map((product) => (
                  <TableRow key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-slate-500 font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {getCategoryName(product.category_id)}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{getUomAbbr(product.uom_id)}</TableCell>
                    <TableCell className="text-right font-medium">{product.reorder_point}</TableCell>
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

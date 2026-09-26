import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  category: z.string().min(1, 'Category is required'),
  uom: z.string().min(1, 'Unit of Measure is required'),
  initialStock: z.coerce.number().min(0, 'Stock cannot be negative').optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function Products() {
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState([
    { id: '1', name: 'Steel Rods', sku: 'ST-001', category: 'Raw Material', uom: 'kg', stock: 1500, location: 'Main Store' },
    { id: '2', name: 'Wooden Chair', sku: 'CH-102', category: 'Finished Goods', uom: 'pcs', stock: 45, location: 'Warehouse A' },
    { id: '3', name: 'Screws (5mm)', sku: 'SC-05', category: 'Hardware', uom: 'box', stock: 300, location: 'Rack B' },
  ]);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { initialStock: 0 }
  });

  const onSubmit = (data: ProductFormValues) => {
    setProducts([{ 
      id: Math.random().toString(), 
      name: data.name, 
      sku: data.sku, 
      category: data.category, 
      uom: data.uom, 
      stock: data.initialStock || 0,
      location: 'Main Store'
    }, ...products]);
    setIsOpen(false);
    reset();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-slate-500 mt-1">Manage your product catalog and view stock availability.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all">
              <Plus className="w-4 h-4 mr-2" />
              New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" {...register('name')} placeholder="e.g. Steel Rods" />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU / Code</Label>
                  <Input id="sku" {...register('sku')} placeholder="ST-001" />
                  {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(val) => setValue('category', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Raw Material">Raw Material</SelectItem>
                      <SelectItem value="Finished Goods">Finished Goods</SelectItem>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="uom">Unit of Measure</Label>
                  <Select onValueChange={(val) => setValue('uom', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="pcs">pcs</SelectItem>
                      <SelectItem value="box">box</SelectItem>
                      <SelectItem value="liters">liters</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.uom && <p className="text-xs text-red-500">{errors.uom.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialStock">Initial Stock</Label>
                  <Input id="initialStock" type="number" {...register('initialStock')} />
                  {errors.initialStock && <p className="text-xs text-red-500">{errors.initialStock.message}</p>}
                </div>
              </div>
              <Button type="submit" className="w-full mt-4">Save Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input className="pl-9 bg-slate-50 dark:bg-slate-900 border-none" placeholder="Search products..." />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="font-medium">Product</TableHead>
                <TableHead className="font-medium">SKU</TableHead>
                <TableHead className="font-medium">Category</TableHead>
                <TableHead className="font-medium text-right">On Hand</TableHead>
                <TableHead className="font-medium">Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-slate-500">{product.sku}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
                      {product.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {product.stock} <span className="text-slate-400 font-normal text-xs">{product.uom}</span>
                  </TableCell>
                  <TableCell className="text-slate-500">{product.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

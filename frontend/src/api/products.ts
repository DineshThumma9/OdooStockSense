import { apiClient } from './client';

export interface ProductCategory {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
}

export interface ProductRead {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  category_id: string | null;
  uom_id: string;
  reorder_point: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  sku: string;
  description?: string;
  category_id?: string;
  uom_id: string;
  reorder_point?: number;
  initial_stock?: number;
  initial_location_id?: string;
}

export interface ProductStockRead {
  product_id: string;
  product_name: string;
  sku: string;
  total_qty: number;
  locations: Array<{
    location_id: string;
    location_name: string;
    warehouse_name: string;
    qty: number;
  }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const productsApi = {
  // Products
  list: (params?: { search?: string; category_id?: string; is_active?: boolean; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<ProductRead>>('/products', { params }).then((r) => r.data),

  create: (data: ProductCreate) =>
    apiClient.post<ProductRead>('/products', data).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ProductRead>(`/products/${id}`).then((r) => r.data),

  update: (id: string, data: Partial<ProductCreate>) =>
    apiClient.put<ProductRead>(`/products/${id}`, data).then((r) => r.data),

  getStock: (id: string) =>
    apiClient.get<ProductStockRead>(`/products/${id}/stock`).then((r) => r.data),

  // Categories
  categories: () =>
    apiClient.get<ProductCategory[]>('/products/categories').then((r) => r.data),

  createCategory: (name: string, parent_id?: string) =>
    apiClient.post<ProductCategory>('/products/categories', { name, parent_id }).then((r) => r.data),

  // Units of Measure
  uoms: () =>
    apiClient.get<UnitOfMeasure[]>('/products/uom').then((r) => r.data),

  // Suppliers
  suppliers: (search?: string) =>
    apiClient.get('/products/suppliers', { params: { search } }).then((r) => r.data),
};

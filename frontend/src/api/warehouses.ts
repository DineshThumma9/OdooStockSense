import { apiClient } from './client';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
}

export interface Location {
  id: string;
  name: string;
  warehouse_id: string;
  location_type: string;
  parent_id: string | null;
  is_active: boolean;
}

export interface WarehouseCreate {
  name: string;
  code: string;
  address?: string;
}

export interface LocationCreate {
  name: string;
  warehouse_id: string;
  location_type?: string;
  parent_id?: string;
}

export const warehousesApi = {
  list: () =>
    apiClient.get<Warehouse[]>('/warehouses').then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Warehouse>(`/warehouses/${id}`).then((r) => r.data),
  create: (data: WarehouseCreate) =>
    apiClient.post<Warehouse>('/warehouses', data).then((r) => r.data),
  update: (id: string, data: Partial<WarehouseCreate>) =>
    apiClient.put<Warehouse>(`/warehouses/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/warehouses/${id}`).then((r) => r.data),

  // Locations
  listLocations: (warehouseId?: string) =>
    apiClient
      .get<Location[]>('/warehouses/locations', { params: warehouseId ? { warehouse_id: warehouseId } : {} })
      .then((r) => r.data),
  createLocation: (data: LocationCreate) =>
    apiClient.post<Location>('/warehouses/locations', data).then((r) => r.data),
};

import { apiClient } from './client';

export type OperationStatus = 'draft' | 'waiting' | 'ready' | 'done' | 'canceled';

// ── Receipts ──────────────────────────────────────────────────────────────────

export interface ReceiptLine {
  id: string;
  receipt_id: string;
  product_id: string;
  expected_qty: number;
  done_qty: number;
}

export interface Receipt {
  id: string;
  reference: string;
  status: OperationStatus;
  supplier_id: string | null;
  destination_location_id: string;
  scheduled_date: string | null;
  notes: string | null;
  created_by: string;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  lines: ReceiptLine[];
}

export interface ReceiptCreate {
  destination_location_id: string;
  supplier_id?: string;
  scheduled_date?: string;
  notes?: string;
  lines: { product_id: string; expected_qty: number }[];
}

// ── Deliveries ────────────────────────────────────────────────────────────────

export interface DeliveryLine {
  id: string;
  delivery_id: string;
  product_id: string;
  qty: number;
}

export interface Delivery {
  id: string;
  reference: string;
  status: OperationStatus;
  source_location_id: string;
  scheduled_date: string | null;
  notes: string | null;
  created_by: string;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  lines: DeliveryLine[];
}

export interface DeliveryCreate {
  source_location_id: string;
  scheduled_date?: string;
  notes?: string;
  lines: { product_id: string; qty: number }[];
}

// ── Internal Transfers ────────────────────────────────────────────────────────

export interface TransferLine {
  id: string;
  transfer_id: string;
  product_id: string;
  qty: number;
}

export interface Transfer {
  id: string;
  reference: string;
  status: OperationStatus;
  from_location_id: string;
  to_location_id: string;
  scheduled_date: string | null;
  notes: string | null;
  created_by: string;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  lines: TransferLine[];
}

export interface TransferCreate {
  from_location_id: string;
  to_location_id: string;
  scheduled_date?: string;
  notes?: string;
  lines: { product_id: string; qty: number }[];
}

// ── Adjustments ───────────────────────────────────────────────────────────────

export interface AdjustmentLine {
  id: string;
  adjustment_id: string;
  product_id: string;
  system_qty: number;
  counted_qty: number;
}

export interface Adjustment {
  id: string;
  reference: string;
  status: OperationStatus;
  location_id: string;
  notes: string | null;
  created_by: string;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  lines: AdjustmentLine[];
}

export interface AdjustmentCreate {
  location_id: string;
  notes?: string;
  lines: { product_id: string; counted_qty: number }[];
}

// ── API clients ───────────────────────────────────────────────────────────────

type PaginatedResponse<T> = { items: T[]; total: number; page: number; limit: number };

export const receiptsApi = {
  list: (params?: { status?: OperationStatus; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Receipt>>('/operations/receipts', { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Receipt>(`/operations/receipts/${id}`).then((r) => r.data),
  create: (data: ReceiptCreate) =>
    apiClient.post<Receipt>('/operations/receipts', data).then((r) => r.data),
  validate: (id: string, lines: { line_id: string; done_qty: number }[]) =>
    apiClient.post<Receipt>(`/operations/receipts/${id}/validate`, { lines }).then((r) => r.data),
  cancel: (id: string) =>
    apiClient.post<Receipt>(`/operations/receipts/${id}/cancel`).then((r) => r.data),
};

export const deliveriesApi = {
  list: (params?: { status?: OperationStatus; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Delivery>>('/operations/deliveries', { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Delivery>(`/operations/deliveries/${id}`).then((r) => r.data),
  create: (data: DeliveryCreate) =>
    apiClient.post<Delivery>('/operations/deliveries', data).then((r) => r.data),
  validate: (id: string) =>
    apiClient.post<Delivery>(`/operations/deliveries/${id}/validate`).then((r) => r.data),
  cancel: (id: string) =>
    apiClient.post<Delivery>(`/operations/deliveries/${id}/cancel`).then((r) => r.data),
};

export const transfersApi = {
  list: (params?: { status?: OperationStatus; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Transfer>>('/operations/transfers', { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Transfer>(`/operations/transfers/${id}`).then((r) => r.data),
  create: (data: TransferCreate) =>
    apiClient.post<Transfer>('/operations/transfers', data).then((r) => r.data),
  validate: (id: string) =>
    apiClient.post<Transfer>(`/operations/transfers/${id}/validate`).then((r) => r.data),
  cancel: (id: string) =>
    apiClient.post<Transfer>(`/operations/transfers/${id}/cancel`).then((r) => r.data),
};

export const adjustmentsApi = {
  list: (params?: { status?: OperationStatus; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Adjustment>>('/operations/adjustments', { params }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Adjustment>(`/operations/adjustments/${id}`).then((r) => r.data),
  create: (data: AdjustmentCreate) =>
    apiClient.post<Adjustment>('/operations/adjustments', data).then((r) => r.data),
  validate: (id: string) =>
    apiClient.post<Adjustment>(`/operations/adjustments/${id}/validate`).then((r) => r.data),
};

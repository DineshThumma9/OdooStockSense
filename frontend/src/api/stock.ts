import { apiClient, BASE_URL } from './client';

export interface DashboardKPIs {
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  pending_receipts: number;
  pending_deliveries: number;
  scheduled_transfers: number;
  recent_movements: number;
  last_updated: string;
}

export interface LedgerEntry {
  id: string;
  product_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  qty: number;
  movement_type: 'receipt' | 'delivery' | 'transfer' | 'adjustment';
  reference_ref: string;
  created_by: string;
  created_at: string;
}

export const stockApi = {
  dashboard: () =>
    apiClient.get<DashboardKPIs>('/dashboard').then((r) => r.data),

  quant: (params?: { product_id?: string; location_id?: string; warehouse_id?: string }) =>
    apiClient.get('/stock/quant', { params }).then((r) => r.data),

  ledger: (params?: {
    product_id?: string;
    movement_type?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient
      .get<{ items: LedgerEntry[]; total: number; page: number; limit: number }>('/stock/ledger', { params })
      .then((r) => r.data),
};

/**
 * Subscribe to live dashboard KPI updates via SSE.
 * Returns a cleanup function — call it to close the connection.
 *
 * Note: Native EventSource doesn't support custom headers.
 * The backend SSE stream currently doesn't require auth header
 * (token is validated via dependency on the route).
 * For production, use @microsoft/fetch-event-source.
 */
export function subscribeDashboard(
  onUpdate: (kpis: DashboardKPIs) => void,
  onError?: () => void
): () => void {
  const token = localStorage.getItem('stocksense_token');
  const url = `${BASE_URL}/dashboard/stream`;

  const es = new EventSource(url);

  es.addEventListener('kpi_update', (e: MessageEvent) => {
    try {
      onUpdate(JSON.parse(e.data) as DashboardKPIs);
    } catch {
      // ignore parse errors
    }
  });

  es.onerror = () => {
    onError?.();
    es.close();
  };

  return () => es.close();
}

/**
 * Subscribe to low-stock alert notifications via SSE.
 */
export function subscribeNotifications(
  onAlert: (alert: {
    product_name: string;
    sku: string;
    current_qty: number;
    reorder_point: number;
    location_name: string;
  }) => void
): () => void {
  const es = new EventSource(`${BASE_URL}/notifications/stream`);

  es.addEventListener('low_stock_alert', (e: MessageEvent) => {
    try {
      onAlert(JSON.parse(e.data));
    } catch {
      // ignore
    }
  });

  es.onerror = () => es.close();
  return () => es.close();
}

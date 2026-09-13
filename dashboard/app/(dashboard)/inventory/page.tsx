import type { Metadata } from 'next';
import { apiFetch } from '../../../lib/api';
import { InventoryClient, Product, Location } from './InventoryClient';
import { Movement, LowStockItem } from './_tables';

export const metadata: Metadata = { title: 'Inventory — QuickFlow POS' };
export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const [movements, products, lowStock, locations] = await Promise.all([
    apiFetch<Movement[]>('/inventory/movements').catch(() => []),
    apiFetch<Product[]>('/products').catch(() => []),
    apiFetch<LowStockItem[]>('/inventory/low-stock').catch(() => []),
    apiFetch<Location[]>('/locations').catch(() => []),
  ]);

  return (
    <InventoryClient
      initialMovements={movements}
      products={products}
      initialLowStock={lowStock}
      locations={locations}
    />
  );
}

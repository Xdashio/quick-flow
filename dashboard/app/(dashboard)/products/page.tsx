import type { Metadata } from 'next';
import { apiFetch } from '../../../lib/api';
import { ProductsGrid } from '../../../components/ProductsGrid';

export const metadata: Metadata = { title: 'Products' };
export const dynamic = 'force-dynamic';

interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  unitType: string;
  isWeighed: boolean;
  priceCents: number;
  costCents: number | null;
  profitCents: number | null;
  marginPct: number | null;
  active: boolean;
  imageKey: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  reorderPoint: number | null;
  totalStock?: number;
  taxCategory?: { id: string; name: string; rateBp: number } | null;
}

interface Category { id: string; name: string; parentId: string | null }
interface TaxCategory { id: string; name: string; rateBp: number }
interface Location { id: string; name: string; address?: string | null }
interface MovementSummary { productId: string; quantityDelta: string }

export default async function ProductsPage() {
  const [products, categories, taxCategories, locations, movements] = await Promise.all([
    apiFetch<Product[]>('/products').catch(() => [] as Product[]),
    apiFetch<Category[]>('/categories').catch(() => [] as Category[]),
    apiFetch<TaxCategory[]>('/tax-categories').catch(() => [] as TaxCategory[]),
    apiFetch<Location[]>('/locations').catch(() => [] as Location[]),
    apiFetch<MovementSummary[]>('/inventory/movements').catch(() => [] as MovementSummary[]),
  ]);

  // Aggregate stock from movements if backend does not compute totalStock directly
  const stockMap = new Map<string, number>();
  for (const m of movements) {
    const prev = stockMap.get(m.productId) ?? 0;
    stockMap.set(m.productId, prev + (parseFloat(m.quantityDelta) || 0));
  }

  const productsWithStock = products.map((p) => ({
    ...p,
    totalStock:
      typeof p.totalStock === 'number'
        ? p.totalStock
        : Math.round((stockMap.get(p.id) ?? 0) * 1000) / 1000,
  }));

  const activeCount = productsWithStock.filter(p => p.active).length;

  return (
    <>
      <div className="topbar">
        <h2>Products</h2>
        <span className="topbar-badge">{activeCount} active · {productsWithStock.length} total</span>
      </div>

      <div className="page-content">
        <div className="section" style={{ overflow: 'visible' }}>
          <div className="section-header">
            <h3>Product Catalog</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Click any card to edit
            </span>
          </div>
          <div style={{ padding: '20px 20px 28px' }}>
            <ProductsGrid
              products={productsWithStock}
              categories={categories}
              taxCategories={taxCategories}
              locations={locations}
            />
          </div>
        </div>
      </div>
    </>
  );
}

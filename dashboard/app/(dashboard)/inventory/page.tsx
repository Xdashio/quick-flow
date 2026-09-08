import type { Metadata } from 'next';
import { apiFetch } from '../../../lib/api';
import { StockMovementForm } from '../../../components/StockMovementForm';
import { LowStockTable, MovementLedgerTable } from './_tables';

export const metadata: Metadata = { title: 'Inventory — QuickFlow POS' };
export const dynamic = 'force-dynamic';

interface Movement {
  id: string;
  productId: string;
  locationId: string;
  quantityDelta: string;
  reason: string;
  referenceId: string | null;
  createdAt: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  unitType: string;
  priceCents: number;
  active: boolean;
}

interface LowStockItem {
  productId: string;
  sku: string;
  name: string;
  unitType: string;
  reorderPoint: number;
  currentStock: number;
}

interface Location {
  id: string;
  name: string;
}

export default async function InventoryPage() {
  const [movements, products, lowStock, locations] = await Promise.all([
    apiFetch<Movement[]>('/inventory/movements').catch(() => []),
    apiFetch<Product[]>('/products').catch(() => []),
    apiFetch<LowStockItem[]>('/inventory/low-stock').catch(() => []),
    apiFetch<Location[]>('/locations').catch(() => []),
  ]);

  const activeProductsCount = products.filter((p) => p.active).length;

  return (
    <>
      <div className="topbar">
        <h2>Inventory & Stock Control</h2>
        <span className="topbar-badge">{movements.length} Total Movements</span>
      </div>

      <div className="page-content">
        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card" style={{ ['--kpi-accent' as any]: lowStock.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
            <div className="kpi-label">Low Stock Warnings</div>
            <div className="kpi-value mono" style={{ color: lowStock.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
              {lowStock.length}
            </div>
            <div className="kpi-sub">At or below reorder threshold</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Active Products</div>
            <div className="kpi-value mono">{activeProductsCount}</div>
            <div className="kpi-sub">Tracked in database</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-label">Active Outlets</div>
            <div className="kpi-value mono">{locations.length}</div>
            <div className="kpi-sub">Store locations</div>
          </div>
        </div>

        {/* Operations Grid */}
        <div className="grid-2">
          <LowStockTable data={lowStock} />

          <div className="section">
            <div className="section-header">
              <h3>Record Movement</h3>
            </div>
            <div className="section-body">
              <StockMovementForm products={products} locations={locations} />
            </div>
          </div>
        </div>

        {/* Full Audit Movement Ledger */}
        <MovementLedgerTable movements={movements} products={products} />
      </div>
    </>
  );
}

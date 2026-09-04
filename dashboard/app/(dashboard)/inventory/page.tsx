import type { Metadata } from 'next';
import { apiFetch, formatDate } from '../../../lib/api';
import { StockMovementForm } from '../../../components/StockMovementForm';

export const metadata: Metadata = { title: 'Inventory' };
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

function reasonBadge(reason: string) {
  const map: Record<string, string> = {
    sale: 'badge-green',
    return: 'badge-blue',
    receiving: 'badge-blue',
    shrinkage: 'badge-red',
    adjustment: 'badge-amber',
    waste: 'badge-red',
  };
  return `badge ${map[reason] ?? 'badge-gray'}`;
}

export default async function InventoryPage() {
  const [movements, products, lowStock, locations] = await Promise.all([
    apiFetch<Movement[]>('/inventory/movements').catch(() => []),
    apiFetch<Product[]>('/products').catch(() => []),
    apiFetch<LowStockItem[]>('/inventory/low-stock').catch(() => []),
    apiFetch<Location[]>('/locations').catch(() => []),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <>
      <div className="topbar">
        <h2>Inventory</h2>
        <span className="topbar-badge">{movements.length} recent movements</span>
      </div>
      <div className="page-content">

        <div className="grid-2">
          {/* ── Low Stock Alerts ──────────────────────────────── */}
          <div className="section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header">
              <h3>Low Stock</h3>
              <span className={`topbar-badge${lowStock.length > 0 ? ' amber' : ''}`}>
                {lowStock.length} at or below reorder point
              </span>
            </div>
            <div className="table-wrap">
              {lowStock.length === 0 ? (
                <div className="empty">
                  <p>
                    Nothing is low right now. Set a &ldquo;Reorder at&rdquo; value on a product in the
                    Products page to start tracking it here.
                  </p>
                </div>
              ) : (
                <table id="low-stock-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Name</th>
                      <th className="text-right">Current Stock</th>
                      <th className="text-right">Reorder At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((item) => (
                      <tr key={item.productId} id={`low-stock-${item.productId}`}>
                        <td className="mono">{item.sku}</td>
                        <td className="font-bold">{item.name}</td>
                        <td className="text-right mono" style={{ color: 'var(--accent-rose)' }}>
                          {item.currentStock} {item.unitType}
                        </td>
                        <td className="text-right mono td-muted">{item.reorderPoint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Record Stock Movement ─────────────────────────── */}
          <div className="section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header">
              <h3>Record Stock Movement</h3>
            </div>
            <div className="section-body">
              <StockMovementForm products={products} locations={locations} />
            </div>
          </div>
        </div>

        {/* ── Stock Overview ────────────────────────────────── */}
        <div className="section">
          <div className="section-header">
            <h3>Active Products</h3>
            <span className="topbar-badge">{products.filter((p) => p.active).length} active</span>
          </div>
          <div className="table-wrap">
            {products.length === 0 ? (
              <div className="empty">
                <p>No products found — add products via the API or register</p>
              </div>
            ) : (
              <table id="products-table">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} id={`product-${p.id}`}>
                      <td className="mono">{p.sku}</td>
                      <td>{p.name}</td>
                      <td className="td-muted">{p.unitType}</td>
                      <td>
                        <span className={`badge ${p.active ? 'badge-green' : 'badge-gray'}`}>
                          {p.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Inventory Movement Ledger ─────────────────────── */}
        <div className="section">
          <div className="section-header">
            <h3>Inventory Movements (Append-Only Ledger)</h3>
            <span className="topbar-badge">last 100</span>
          </div>
          <div className="table-wrap">
            {movements.length === 0 ? (
              <div className="empty">
                <p>No inventory movements recorded yet</p>
              </div>
            ) : (
              <table id="movements-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Reason</th>
                    <th className="text-right">Δ Qty</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const prod = productMap.get(m.productId);
                    const delta = parseFloat(m.quantityDelta);
                    return (
                      <tr key={m.id}>
                        <td>{prod?.name ?? <span className="mono td-muted">{m.productId.slice(0, 8)}…</span>}</td>
                        <td><span className={reasonBadge(m.reason)}>{m.reason}</span></td>
                        <td
                          className="text-right font-bold mono"
                          style={{ color: delta >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}
                        >
                          {delta >= 0 ? '+' : ''}{delta.toFixed(3)}
                        </td>
                        <td className="td-muted">{formatDate(m.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </>
  );
}

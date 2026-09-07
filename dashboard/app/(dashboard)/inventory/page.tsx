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
  const map: Record<string, { class: string; icon: React.ReactNode }> = {
    sale: {
      class: 'badge-green',
      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>,
    },
    receiving: {
      class: 'badge-blue',
      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6"/></svg>,
    },
    return: {
      class: 'badge-blue',
      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
    },
    shrinkage: {
      class: 'badge-red',
      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>,
    },
    adjustment: {
      class: 'badge-amber',
      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    },
    waste: {
      class: 'badge-red',
      icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    },
  };

  const item = map[reason] ?? {
    class: 'badge-gray',
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/></svg>,
  };

  return (
    <span className={`badge ${item.class}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
      {item.icon}
      {reason}
    </span>
  );
}

export default async function InventoryPage() {
  const [movements, products, lowStock, locations] = await Promise.all([
    apiFetch<Movement[]>('/inventory/movements').catch(() => []),
    apiFetch<Product[]>('/products').catch(() => []),
    apiFetch<LowStockItem[]>('/inventory/low-stock').catch(() => []),
    apiFetch<Location[]>('/locations').catch(() => []),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const activeProductsCount = products.filter((p) => p.active).length;

  return (
    <>
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-primary-bg)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m7.5 4.27 9 5.15" />
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Inventory Control</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Stock movements, reorder alerts, and real-time ledger</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="topbar-badge" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {movements.length} Recent Movements
          </span>
        </div>
      </div>

      <div className="page-content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── KPI Summary Cards ────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent-amber)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Low Stock Items
            </div>
            <div className="kpi-value" style={{ color: lowStock.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
              {lowStock.length}
            </div>
            <div className="kpi-sub">At or below reorder threshold</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent-primary)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              Active Products
            </div>
            <div className="kpi-value">{activeProductsCount}</div>
            <div className="kpi-sub">Tracked in POS database</div>
          </div>

          <div className="kpi-card" style={{ '--kpi-accent': 'var(--accent-mineral)' } as React.CSSProperties}>
            <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Active Locations
            </div>
            <div className="kpi-value">{locations.length}</div>
            <div className="kpi-sub">Primary store location</div>
          </div>
        </div>

        {/* ── Main Operations Bento Grid ───────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 20 }}>
          
          {/* Low Stock Alerts */}
          <div className="section" style={{ margin: 0 }}>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-amber)' }}>
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Low Stock Warnings</h3>
              </div>
              <span className={`topbar-badge ${lowStock.length > 0 ? 'amber' : ''}`}>
                {lowStock.length} items critical
              </span>
            </div>

            <div className="table-wrap">
              {lowStock.length === 0 ? (
                <div className="empty" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', color: 'var(--accent-emerald)', opacity: 0.8 }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  <p style={{ fontSize: 13, margin: 0 }}>All inventory levels are above reorder points.</p>
                </div>
              ) : (
                <table id="low-stock-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product Name</th>
                      <th className="text-right">Current Stock</th>
                      <th className="text-right">Reorder Point</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.map((item) => (
                      <tr key={item.productId} id={`low-stock-${item.productId}`}>
                        <td className="mono" style={{ fontSize: 12 }}>{item.sku}</td>
                        <td className="font-bold">{item.name}</td>
                        <td className="text-right mono" style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>
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

          {/* Quick Record Stock Movement Form */}
          <div className="section" style={{ margin: 0 }}>
            <div className="section-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}>
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Record Stock Movement</h3>
            </div>
            <div className="section-body" style={{ padding: '20px' }}>
              <StockMovementForm products={products} locations={locations} />
            </div>
          </div>
        </div>

        {/* ── Inventory Movement Ledger ───────────────────────────── */}
        <div className="section" style={{ margin: 0 }}>
          <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-mineral)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Audit Ledger (Append-Only)</h3>
            </div>
            <span className="topbar-badge">Last 100 Entries</span>
          </div>

          <div className="table-wrap">
            {movements.length === 0 ? (
              <div className="empty" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 13, margin: 0 }}>No stock movements recorded yet.</p>
              </div>
            ) : (
              <table id="movements-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Reason</th>
                    <th className="text-right">Quantity Delta</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const prod = productMap.get(m.productId);
                    const delta = parseFloat(m.quantityDelta);
                    return (
                      <tr key={m.id}>
                        <td>
                          {prod ? (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span className="font-bold">{prod.name}</span>
                              <span className="mono td-muted" style={{ fontSize: 11 }}>{prod.sku}</span>
                            </div>
                          ) : (
                            <span className="mono td-muted">{m.productId.slice(0, 8)}…</span>
                          )}
                        </td>
                        <td>{reasonBadge(m.reason)}</td>
                        <td
                          className="text-right font-bold mono"
                          style={{
                            color: delta >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                            fontSize: 13
                          }}
                        >
                          {delta >= 0 ? '+' : ''}{delta.toFixed(3)}
                        </td>
                        <td className="td-muted" style={{ fontSize: 12 }}>{formatDate(m.createdAt)}</td>
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


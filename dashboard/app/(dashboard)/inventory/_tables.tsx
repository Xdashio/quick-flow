'use client';

import { useMemo } from 'react';
import { DataTable, Column } from '../../../components/DataTable';
import { formatDate } from '../../../lib/format';

export interface Movement {
  id: string;
  productId: string;
  locationId: string;
  quantityDelta: string;
  reason: string;
  referenceId: string | null;
  createdAt: string;
}

export interface MovementProduct {
  id: string;
  sku: string;
  name: string;
}

export interface LowStockItem {
  productId: string;
  sku: string;
  name: string;
  unitType: string;
  reorderPoint: number;
  currentStock: number;
}

function reasonBadge(reason: string) {
  const map: Record<string, string> = {
    sale: 'badge-emerald',
    receiving: 'badge-mineral',
    return: 'badge-mineral',
    shrinkage: 'badge-rose',
    adjustment: 'badge-amber',
    waste: 'badge-rose',
  };

  return (
    <span className={`badge ${map[reason] ?? 'badge-gray'}`}>
      {map[reason] ? reasonLabel(reason) : reason}
    </span>
  );
}

function reasonLabel(reason: string) {
  const map: Record<string, string> = {
    sale: 'Sale',
    receiving: 'Stock In',
    return: 'Customer Return',
    shrinkage: 'Shrinkage',
    adjustment: 'Audit Adjust',
    waste: 'Waste / Damaged',
  };
  return map[reason] ?? reason;
}

const lowStockColumns: Column<LowStockItem>[] = [
  {
    key: 'sku',
    header: 'SKU',
    pinned: 'left',
    cell: (item) => <span className="mono td-muted">{item.sku}</span>,
  },
  {
    key: 'name',
    header: 'Product Name',
    cell: (item) => <span className="font-bold">{item.name}</span>,
  },
  {
    key: 'currentStock',
    header: 'Current Stock',
    cell: (item) => (
      <span className="mono font-bold" style={{ color: 'var(--accent-rose)' }}>
        {item.currentStock} {item.unitType}
      </span>
    ),
  },
  {
    key: 'reorderPoint',
    header: 'Reorder At',
    cell: (item) => <span className="mono td-muted">{item.reorderPoint}</span>,
  },
];

export function LowStockTable({ data }: { data: LowStockItem[] }) {
  return (
    <DataTable<LowStockItem>
      title="Low Stock Alerts"
      subtitle="Products reaching minimum reorder limits"
      data={data}
      columns={lowStockColumns}
      searchKey="name"
      searchPlaceholder="Search low stock..."
      emptyMessage="All stock levels are optimal!"
      defaultPageSize={10}
    />
  );
}

export function MovementLedgerTable({
  movements,
  products,
}: {
  movements: Movement[];
  products: MovementProduct[];
}) {
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const columns: Column<Movement>[] = useMemo(
    () => [
      {
        key: 'product',
        header: 'Product Details',
        pinned: 'left',
        cell: (m) => {
          const prod = productMap.get(m.productId);
          return prod ? (
            <span>
              <span className="font-bold">{prod.name}</span>
              <br />
              <span className="mono td-muted">{prod.sku}</span>
            </span>
          ) : (
            <span className="mono td-muted">{m.productId.slice(0, 8)}…</span>
          );
        },
      },
      {
        key: 'reason',
        header: 'Movement Reason',
        cell: (m) => reasonBadge(m.reason),
      },
      {
        key: 'quantityDelta',
        header: 'Quantity Change',
        cell: (m) => {
          const delta = parseFloat(m.quantityDelta);
          return (
            <span className="mono font-bold" style={{ color: delta >= 0 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(3)}
            </span>
          );
        },
      },
      {
        key: 'createdAt',
        header: 'Timestamp',
        cell: (m) => <span className="td-muted">{formatDate(m.createdAt)}</span>,
      },
    ],
    [productMap],
  );

  return (
    <DataTable<Movement>
      title="Stock Movement Audit Ledger"
      subtitle="Append-only log of stock entries, sales & adjustments"
      data={movements}
      columns={columns}
      searchKey={(m) => {
        const p = productMap.get(m.productId);
        return `${p?.name || ''} ${p?.sku || ''} ${m.reason}`;
      }}
      searchPlaceholder="Filter movements by product, SKU or reason..."
      emptyMessage="No stock movements recorded yet."
      defaultPageSize={10}
    />
  );
}

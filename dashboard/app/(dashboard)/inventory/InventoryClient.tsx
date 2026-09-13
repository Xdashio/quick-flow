'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LowStockTable, MovementLedgerTable, Movement, LowStockItem } from './_tables';
import { StockMovementForm } from '../../../components/StockMovementForm';

export interface Product {
  id: string;
  sku: string;
  name: string;
  unitType: string;
  priceCents: number;
  active: boolean;
}

export interface Location {
  id: string;
  name: string;
}

export interface InventoryClientProps {
  initialMovements: Movement[];
  products: Product[];
  initialLowStock: LowStockItem[];
  locations: Location[];
}

export function InventoryClient({
  initialMovements,
  products,
  initialLowStock,
  locations,
}: InventoryClientProps) {
  const router = useRouter();
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [lowStock, setLowStock] = useState<LowStockItem[]>(initialLowStock);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  // Sync state if server re-renders with fresh data
  useEffect(() => {
    setMovements(initialMovements);
  }, [initialMovements]);

  useEffect(() => {
    setLowStock(initialLowStock);
  }, [initialLowStock]);

  const handleRestock = useCallback((productId: string) => {
    setSelectedProductId(productId);
    const formElem = document.getElementById('stock-movement-form');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const handleMovementRecorded = useCallback(
    (
      newMovement: any,
      newBalance?: number,
      productId?: string,
      quantityDelta?: number,
    ) => {
      // 1. Optimistically update lowStock list
      if (productId) {
        setLowStock((prev) => {
          return prev
            .map((item) => {
              if (item.productId === productId) {
                const updatedStock =
                  newBalance !== undefined
                    ? Number(newBalance)
                    : item.currentStock + (quantityDelta ?? 0);
                return { ...item, currentStock: updatedStock };
              }
              return item;
            })
            .filter((item) => item.currentStock <= item.reorderPoint);
        });
      }

      // 2. Optimistically prepend new movement to the audit ledger
      if (newMovement) {
        setMovements((prev) => [newMovement, ...prev]);
      }

      // 3. Silent authoritative re-fetch in the background
      fetch('/api/proxy/inventory/low-stock', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((freshLowStock) => {
          if (Array.isArray(freshLowStock)) {
            setLowStock(freshLowStock);
          }
        })
        .catch(() => {});

      fetch('/api/proxy/inventory/movements', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((freshMovements) => {
          if (Array.isArray(freshMovements)) {
            setMovements(freshMovements);
          }
        })
        .catch(() => {});

      router.refresh();
    },
    [router],
  );

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
          <div
            className="kpi-card"
            style={{
              ['--kpi-accent' as any]:
                lowStock.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
            }}
          >
            <div className="kpi-label">Low Stock Warnings</div>
            <div
              className="kpi-value mono"
              style={{
                color: lowStock.length > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
              }}
            >
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
          <LowStockTable data={lowStock} onRestock={handleRestock} />

          <div className="section">
            <div className="section-header">
              <h3>Record Movement</h3>
            </div>
            <div className="section-body">
              <StockMovementForm
                products={products}
                locations={locations}
                selectedProductId={selectedProductId}
                onMovementRecorded={handleMovementRecorded}
              />
            </div>
          </div>
        </div>

        {/* Full Audit Movement Ledger */}
        <MovementLedgerTable movements={movements} products={products} />
      </div>
    </>
  );
}

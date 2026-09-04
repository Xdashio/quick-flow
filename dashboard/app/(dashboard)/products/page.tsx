import type { Metadata } from 'next';
import { apiFetch, formatKes } from '../../../lib/api';
import { ProductImageUpload } from '../../../components/ProductImageUpload';

export const metadata: Metadata = { title: 'Products' };
export const dynamic = 'force-dynamic';

interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  unitType: string;
  priceCents: number;
  active: boolean;
  imageKey: string | null;
  imageUrl: string | null;
}

export default async function ProductsPage() {
  const products = await apiFetch<Product[]>('/products').catch(() => [] as Product[]);

  return (
    <>
      <div className="topbar">
        <h2>Products</h2>
        <span className="topbar-badge">{products.length} products</span>
      </div>
      <div className="page-content">

        <div className="section">
          <div className="section-header">
            <h3>Product Catalog</h3>
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
                    <th>Image</th>
                    <th>SKU</th>
                    <th>Name</th>
                    <th>Unit</th>
                    <th className="text-right">Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} id={`product-${p.id}`}>
                      <td>
                        <ProductImageUpload
                          productId={p.id}
                          productName={p.name}
                          imageUrl={p.imageUrl}
                        />
                      </td>
                      <td className="mono">{p.sku}</td>
                      <td className="font-bold">{p.name}</td>
                      <td className="td-muted">{p.unitType}</td>
                      <td className="text-right mono">{formatKes(p.priceCents)}</td>
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

      </div>
    </>
  );
}

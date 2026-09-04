import type { Metadata } from 'next';
import { apiFetch } from '../../../lib/api';
import { CreateCategoryForm } from '../../../components/CreateCategoryForm';
import { DeleteCategoryButton } from '../../../components/DeleteCategoryButton';

export const metadata: Metadata = { title: 'Categories' };
export const dynamic = 'force-dynamic';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  productCount: number;
  childCount: number;
}

export default async function CategoriesPage() {
  const categories = await apiFetch<Category[]>('/categories').catch(() => [] as Category[]);
  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  // Top-level first, then their children grouped underneath — a simple two-level tree view.
  const topLevel = categories.filter((c) => !c.parentId);
  const byParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (c.parentId) {
      byParent.set(c.parentId, [...(byParent.get(c.parentId) ?? []), c]);
    }
  }
  const ordered: Category[] = [];
  for (const top of topLevel) {
    ordered.push(top);
    for (const child of byParent.get(top.id) ?? []) {
      ordered.push(child);
    }
  }
  // Orphaned categories (parentId points at something missing) — show at the end so nothing's hidden.
  const seenIds = new Set(ordered.map((c) => c.id));
  for (const c of categories) {
    if (!seenIds.has(c.id)) ordered.push(c);
  }

  return (
    <>
      <div className="topbar">
        <h2>Categories</h2>
        <span className="topbar-badge">{categories.length} categories</span>
      </div>
      <div className="page-content">

        <div className="grid-2">
          <div className="section" style={{ gridColumn: '1 / -1' }}>
            <div className="section-header">
              <h3>All Categories</h3>
            </div>
            <div className="table-wrap">
              {categories.length === 0 ? (
                <div className="empty">
                  <p>No categories yet — create one to start organizing products</p>
                </div>
              ) : (
                <table id="categories-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Parent</th>
                      <th className="text-right">Products</th>
                      <th className="text-right">Subcategories</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordered.map((c) => (
                      <tr key={c.id} id={`category-${c.id}`}>
                        <td className="font-bold">
                          {c.parentId ? <span style={{ opacity: 0.5 }}>— </span> : null}
                          {c.name}
                        </td>
                        <td className="td-muted">
                          {c.parentId ? nameById.get(c.parentId) ?? '—' : '—'}
                        </td>
                        <td className="text-right mono">{c.productCount}</td>
                        <td className="text-right mono">{c.childCount}</td>
                        <td>
                          <DeleteCategoryButton
                            categoryId={c.id}
                            categoryName={c.name}
                            productCount={c.productCount}
                            childCount={c.childCount}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h3>Create Category</h3>
            </div>
            <div className="section-body">
              <CreateCategoryForm categories={categories} />
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

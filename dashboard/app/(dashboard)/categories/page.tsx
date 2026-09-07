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
  const seenIds = new Set(ordered.map((c) => c.id));
  for (const c of categories) {
    if (!seenIds.has(c.id)) ordered.push(c);
  }

  const topLevelCount = topLevel.length;

  return (
    <>
      <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-primary-bg)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Product Categories</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>Organize catalog structure and sub-category relationships</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="topbar-badge" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            {categories.length} Total ({topLevelCount} Top-level)
          </span>
        </div>
      </div>

      <div className="page-content" style={{ padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          
          {/* Categories List */}
          <div className="section" style={{ margin: 0 }}>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}>
                  <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
                </svg>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Category Hierarchy</h3>
              </div>
              <span className="topbar-badge">{categories.length} Categories</span>
            </div>

            <div className="table-wrap">
              {categories.length === 0 ? (
                <div className="empty" style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', opacity: 0.5 }}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <p style={{ fontSize: 13, margin: 0 }}>No categories created yet. Create one to organize products.</p>
                </div>
              ) : (
                <table id="categories-table">
                  <thead>
                    <tr>
                      <th>Category Name</th>
                      <th>Parent Category</th>
                      <th className="text-right">Products</th>
                      <th className="text-right">Subcategories</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordered.map((c) => (
                      <tr key={c.id} id={`category-${c.id}`}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: c.parentId ? 16 : 0 }}>
                            {c.parentId ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                                <path d="M9 18l6-6-6-6"/>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}>
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                              </svg>
                            )}
                            <span className="font-bold" style={{ color: c.parentId ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                              {c.name}
                            </span>
                          </div>
                        </td>
                        <td className="td-muted" style={{ fontSize: 12 }}>
                          {c.parentId ? (
                            <span className="badge badge-gray" style={{ fontSize: 11 }}>
                              {nameById.get(c.parentId) ?? 'Parent'}
                            </span>
                          ) : (
                            <span style={{ opacity: 0.4 }}>—</span>
                          )}
                        </td>
                        <td className="text-right mono font-bold" style={{ fontSize: 13 }}>{c.productCount}</td>
                        <td className="text-right mono td-muted">{c.childCount}</td>
                        <td className="text-right">
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

          {/* Create Category Form */}
          <div className="section" style={{ margin: 0 }}>
            <div className="section-header" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--accent-primary)' }}>
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Create New Category</h3>
            </div>
            <div className="section-body" style={{ padding: '20px' }}>
              <CreateCategoryForm categories={categories} />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}


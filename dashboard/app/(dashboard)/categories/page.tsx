import type { Metadata } from 'next';
import { apiFetch } from '../../../lib/api';
import { CreateCategoryForm } from '../../../components/CreateCategoryForm';
import { CategoriesTable } from './_tables';
import { BarDistributionChart } from '../../../components/Charts';

export const metadata: Metadata = { title: 'Categories — QuickFlow POS' };
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
  const nameById: Record<string, string> = Object.fromEntries(
    categories.map((c) => [c.id, c.name]),
  );

  // Top-level first, then children grouped
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

  // Top 5 categories for distribution chart
  const topCategoriesDist = [...categories]
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 5)
    .map((c) => ({
      label: c.name,
      value: c.productCount,
    }));

  return (
    <>
      <div className="topbar">
        <h2>Product Categories</h2>
        <span className="topbar-badge">{categories.length} Total ({topLevel.length} Top-level)</span>
      </div>

      <div className="page-content">
        <div className="grid-2">
          <CategoriesTable data={ordered} nameById={nameById} />

          <div>
            <BarDistributionChart
              title="Catalog Volume Distribution"
              subtitle="Top categories by product count"
              data={topCategoriesDist}
              valueSuffix=" products"
            />

            <div className="section" style={{ marginTop: 16 }}>
              <div className="section-header">
                <h3>Create New Category</h3>
              </div>
              <div className="section-body">
                <CreateCategoryForm categories={categories} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

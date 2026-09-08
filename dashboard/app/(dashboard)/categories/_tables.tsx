'use client';

import { DataTable, Column } from '../../../components/DataTable';
import { DeleteCategoryButton } from '../../../components/DeleteCategoryButton';

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  productCount: number;
  childCount: number;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  productCount: number;
  childCount: number;
}

// Small keyword-matched glyphs so each top-level category reads at a glance.
// 13px stroke icons in a muted group tint — no bulky chip containers.
const GLYPHS: { match: string[]; color: string; path: React.ReactNode }[] = [
  { match: ['beverage', 'drink', 'juice', 'soda', 'water', 'tea', 'coffee'], color: 'var(--accent-mineral)', path: (<><path d="M4 9h12v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9z" /><path d="M16 10h2a2 2 0 0 1 0 4h-2" /><path d="M7 4.5v1.5M11 4.5v1.5" /></>) },
  { match: ['dairy', 'milk', 'cheese', 'yoghurt', 'yogurt', 'egg'], color: 'var(--accent-mineral)', path: (<path d="M12 3.5c2.8 3.8 5.5 6.8 5.5 10.5a5.5 5.5 0 0 1-11 0C6.5 10.3 9.2 7.3 12 3.5z" />) },
  { match: ['bakery', 'bread', 'cake', 'pastry', 'bun'], color: 'var(--accent-amber)', path: (<><path d="M6 20v-9a6 6 0 0 1 12 0v9" /><path d="M6 20h12" /></>) },
  { match: ['fruit', 'vegetable', 'produce', 'grocer', 'farm'], color: 'var(--accent-emerald)', path: (<><path d="M12 8.5C8.5 6.8 5 9 5 13.5c0 3.8 2.8 6.5 4.8 6.5.9 0 1.4-.6 2.2-.6s1.3.6 2.2.6c2 0 4.8-2.7 4.8-6.5 0-4.5-3.5-6.7-7-5z" /><path d="M12 8.5c0-2 .8-3.6 2.6-4.5" /></>) },
  { match: ['meat', 'chicken', 'beef', 'poultry', 'butcher'], color: 'var(--accent-rose)', path: (<><path d="M14.5 9.5a4.2 4.2 0 0 0-5.6 5.6L4 20l1 1 4.9-4.9a4.2 4.2 0 0 0 5.6-5.6L20 6l1 1-6.5 6.5z" /><path d="M6.5 17.5L4 20" /></>) },
  { match: ['fish', 'seafood'], color: 'var(--accent-mineral)', path: (<><path d="M15 12c-2.8-2.8-6.3-3.8-9.5-3.8 0 0 .9 3.8.9 3.8s-.9 3.8-.9 3.8c3.2 0 6.7-1 9.5-3.8z" /><path d="M15 12l6-3v6l-6-3z" /><circle cx="8.5" cy="11.5" r="0.4" fill="currentColor" /></>) },
  { match: ['snack', 'chip', 'crisp', 'sweet', 'chocolate', 'candy', 'biscuit', 'cookie'], color: 'var(--accent-amber)', path: (<><path d="M9 9h6v6H9z" /><path d="M9 10.5L4 7.5v9L9 13.5M15 10.5l5-3v9l-5-3" /></>) },
  { match: ['frozen', 'ice'], color: 'var(--accent-mineral)', path: (<><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9M12 3l-2 2.2M12 3l2 2.2M12 21l-2-2.2M12 21l2-2.2" /></>) },
  { match: ['household', 'cleaning', 'detergent', 'soap', 'tissue'], color: 'var(--accent-emerald)', path: (<><path d="M4 11.5L12 4.5l8 7" /><path d="M6.5 10v9.5h11V10" /></>) },
  { match: ['baby', 'diaper', 'infant'], color: 'var(--accent-amber)', path: (<><circle cx="12" cy="12" r="8.5" /><path d="M9 10h.01M15 10h.01M8.8 14a3.6 3.6 0 0 0 6.4 0" /></>) },
  { match: ['beauty', 'cosmetic', 'personal', 'care', 'lotion', 'shampoo'], color: 'var(--accent-rose)', path: (<><path d="M12 4l1.7 5 5 1.7-5 1.7-1.7 5-1.7-5-5-1.7 5-1.7L12 4z" /><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z" /></>) },
  { match: ['stationery', 'office', 'school', 'book', 'pen'], color: 'var(--accent-amber)', path: (<><path d="M4 20l1-4.5L16 4.5l3.5 3.5L8.5 19 4 20z" /><path d="M14 6.5l3.5 3.5" /></>) },
  { match: ['headphone', 'earphone', 'earbud', 'headset', 'airpod'], color: 'var(--accent-mineral)', path: (<><path d="M4 15v-1.5a8 8 0 0 1 16 0V15" /><rect x="3" y="14" width="4.5" height="6.5" rx="2" /><rect x="16.5" y="14" width="4.5" height="6.5" rx="2" /></>) },
  { match: ['speaker', 'soundbar', 'subwoofer', 'boombox'], color: 'var(--accent-mineral)', path: (<><rect x="6" y="3" width="12" height="18" rx="2.5" /><circle cx="12" cy="14" r="3.2" /><circle cx="12" cy="14" r="0.9" fill="currentColor" stroke="none" /><circle cx="12" cy="7.5" r="0.9" fill="currentColor" stroke="none" /></>) },
  { match: ['charger', 'charging', 'batter', 'power bank', 'powerbank'], color: 'var(--accent-amber)', path: (<><rect x="2.5" y="8" width="15" height="9" rx="2" /><path d="M20.5 11v3" /><path d="M11 9.5l-2.2 3H11l-1.2 3 3.4-4.2H11.2L11 9.5z" fill="currentColor" stroke="none" /></>) },
  { match: ['cable', 'cord', 'usb', 'lightning', 'type-c', 'hdmi'], color: 'var(--accent-mineral)', path: (<><rect x="14.5" y="5" width="6" height="5" rx="1" /><path d="M16 5V3.5M19 5V3.5" /><path d="M17.5 10v2.5a5 5 0 0 1-5 5H7a3.5 3.5 0 0 0 0 7h2" /></>) },
  { match: ['jack', 'aux', 'splitter'], color: 'var(--accent-mineral)', path: (<><path d="M3.5 12H13" /><path d="M13 9.5h4.5a2.5 2.5 0 0 1 0 5H13" /><path d="M6.5 10.5v3M9.5 10.5v3" /></>) },
  { match: ['mouse', 'mice'], color: 'var(--accent-mineral)', path: (<><rect x="7" y="3.5" width="10" height="17" rx="5" /><path d="M12 7v3.5" /></>) },
  { match: ['keyboard'], color: 'var(--accent-mineral)', path: (<><rect x="3" y="8" width="18" height="9" rx="2" /><path d="M7 11.5h.01M11 11.5h.01M15 11.5h.01M17.5 11.5h.01M7 14.5h10" /></>) },
  { match: ['adapter', 'adaptor', 'plug', 'converter'], color: 'var(--accent-amber)', path: (<><rect x="7" y="10.5" width="10" height="10" rx="2" /><path d="M9.7 10.5V6M14.3 10.5V6M9.7 3.5V5M14.3 3.5V5" /></>) },
  { match: ['remote'], color: 'var(--accent-mineral)', path: (<><rect x="8" y="3" width="8" height="18" rx="3.5" /><circle cx="12" cy="8" r="1.6" /><path d="M10.5 12.5h.01M13.5 12.5h.01M10.5 16h.01M13.5 16h.01" /></>) },
  { match: ['socket', 'extension', 'power strip', 'multiplug', 'surge'], color: 'var(--accent-amber)', path: (<><rect x="3.5" y="9" width="17" height="8" rx="2.5" /><circle cx="9" cy="13" r="1.1" /><circle cx="14.5" cy="13" r="1.1" /></>) },
  { match: ['storage', 'memory', 'flash drive', 'hard drive', 'sd card', 'pendrive'], color: 'var(--accent-emerald)', path: (<><rect x="7.5" y="8" width="9" height="12.5" rx="2" /><path d="M10 8V5h4v3M10 5H8.5M14 5h1.5" /></>) },
  { match: ['case', 'cover', 'protector', 'pouch', 'sleeve'], color: 'var(--accent-mineral)', path: (<><rect x="7" y="3" width="10" height="18" rx="3" /><path d="M11 17.5h2" /></>) },
  { match: ['watch', 'smartwatch', 'fitband', 'fitness band'], color: 'var(--accent-mineral)', path: (<><rect x="7" y="7" width="10" height="10" rx="3.5" /><path d="M9.5 7L10 3.5h4L14.5 7M9.5 17l.5 3.5h4l.5-3.5" /></>) },
  { match: ['torch', 'flashlight', 'bulb', 'lantern', 'lamp'], color: 'var(--accent-amber)', path: (<><path d="M9.6 17.5a4.3 4.3 0 1 1 4.8 0c-.8.7-1 1.5-1 2.5h-2.8c0-1-.2-1.8-1-2.5z" /><path d="M10.6 21.5h2.8" /></>) },
  { match: ['electronic', 'phone', 'computer', 'laptop', 'gadget', 'accessor'], color: 'var(--accent-mineral)', path: (<><rect x="8" y="8" width="8" height="8" rx="1.5" /><path d="M4 10.5h2M4 13.5h2M18 10.5h2M18 13.5h2M10.5 4v2M13.5 4v2M10.5 18v2M13.5 18v2" /></>) },
  { match: ['cloth', 'fashion', 'shoe', 'wear', 'apparel'], color: 'var(--accent-rose)', path: (<path d="M9 4L4 7.5 6 11.5l3-1V20h6v-9.5l3 1 2-4L15 4a3 3 0 0 1-6 0z" />) },
  { match: ['pharma', 'medicine', 'medical', 'health', 'drug'], color: 'var(--accent-emerald)', path: (<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5V4z" />) },
  { match: ['pet', 'dog', 'cat', 'animal'], color: 'var(--accent-amber)', path: (<><path d="M12 13.5c-2.4 0-4.8 1.9-4.8 4.2 0 1.3 1 2.3 2.4 2.3.9 0 1.5-.4 2.4-.4s1.5.4 2.4.4c1.4 0 2.4-1 2.4-2.3 0-2.3-2.4-4.2-4.8-4.2z" /><circle cx="7.6" cy="10" r="1.3" /><circle cx="12" cy="8.4" r="1.3" /><circle cx="16.4" cy="10" r="1.3" /></>) },
  { match: ['wine', 'beer', 'alcohol', 'spirit', 'liquor'], color: 'var(--accent-rose)', path: (<><path d="M7.5 3.5h9V9a4.5 4.5 0 0 1-9 0V3.5z" /><path d="M12 13.5V20M8.5 20h7" /></>) },
  { match: ['grain', 'rice', 'flour', 'cereal', 'pasta', 'maize', 'wheat'], color: 'var(--accent-amber)', path: (<><path d="M12 21v-8" /><path d="M12 13c-3 0-5-2.2-5-5.5 3 0 5 2.2 5 5.5zM12 13c3 0 5-2.2 5-5.5-3 0-5 2.2-5 5.5z" /><path d="M12 17.5c-2.2 0-3.8-1.6-3.8-4M12 17.5c2.2 0 3.8-1.6 3.8-4" /></>) },
];

function CategoryGlyph({ name }: { name: string }) {
  const lower = name.toLowerCase();
  const hit = GLYPHS.find((g) => g.match.some((k) => lower.includes(k)));
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: hit?.color ?? 'var(--accent-primary)', flexShrink: 0 }}
    >
      {hit?.path ?? (<><path d="M4.5 4.5H11l8.5 8.5-6.5 6.5L4.5 11V4.5z" /><circle cx="9" cy="9" r="1" fill="currentColor" /></>)}
    </svg>
  );
}

export function CategoriesTable({
  data,
  nameById,
}: {
  data: Category[];
  nameById: Record<string, string>;
}) {
  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category Name',
      pinned: 'left',
      cell: (c) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, paddingLeft: c.parentId ? 14 : 0 }}>
          {c.parentId ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
            </svg>
          ) : (
            <CategoryGlyph name={c.name} />
          )}
          <span className="font-bold" style={c.parentId ? { color: 'var(--text-secondary)', fontWeight: 500 } : { fontSize: 13 }}>
            {c.name}
          </span>
        </span>
      ),
    },
    {
      key: 'parentId',
      header: 'Parent Category',
      cell: (c) =>
        c.parentId ? (
          <span className="badge badge-gray">
            {nameById[c.parentId] ?? 'Parent'}
          </span>
        ) : (
          <span className="td-muted">—</span>
        ),
    },
    {
      key: 'productCount',
      header: 'Products',
      cell: (c) => <span className="mono font-bold" style={{ color: 'var(--text-primary)' }}>{c.productCount}</span>,
    },
    {
      key: 'childCount',
      header: 'Subcategories',
      cell: (c) => <span className="mono td-muted">{c.childCount}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      pinned: 'right',
      cell: (c) => (
        <DeleteCategoryButton
          categoryId={c.id}
          categoryName={c.name}
          productCount={c.productCount}
          childCount={c.childCount}
        />
      ),
    },
  ];

  return (
    <DataTable<Category>
      title="Category Hierarchy & Catalog Counts"
      subtitle="Organized product groupings and child relations"
      data={data}
      columns={columns}
      searchKey="name"
      searchPlaceholder="Search categories..."
      emptyMessage="No categories created yet."
      defaultPageSize={10}
      defaultCompact
    />
  );
}

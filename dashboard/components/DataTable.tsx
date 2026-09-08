'use client';

import React, { useState, useMemo } from 'react';
import { Select } from './Select';

export interface Column<T> {
  key: string;
  header: string;
  pinned?: 'left' | 'right';
  cell: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: keyof T | ((item: T) => string);
  searchPlaceholder?: string;
  renderExpandedRow?: (item: T) => React.ReactNode;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  defaultCompact?: boolean;
  emptyMessage?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = 'Search records...',
  renderExpandedRow,
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  defaultCompact = false,
  emptyMessage = 'No records found',
  title,
  subtitle,
  actions,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [expandedRows, setExpandedRows] = useState<Record<string | number, boolean>>({});
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(
    columns.map((c) => c.key)
  );
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [isCompact, setIsCompact] = useState(defaultCompact);

  // Search Filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchKey) return data;
    const query = searchQuery.toLowerCase().trim();

    return data.filter((item) => {
      let val = '';
      if (typeof searchKey === 'function') {
        val = searchKey(item);
      } else if (item[searchKey] !== undefined) {
        val = String(item[searchKey]);
      }
      return val.toLowerCase().includes(query);
    });
  }, [data, searchQuery, searchKey]);

  // Reset to page 1 on search
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, pageSize]);

  // Pagination Math
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedData = useMemo(() => {
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, startIndex, endIndex]);

  const activeColumns = useMemo(() => {
    return columns.filter((col) => visibleColumnKeys.includes(col.key));
  }, [columns, visibleColumnKeys]);

  const toggleRowExpanded = (idx: number) => {
    setExpandedRows((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleColumnVisibility = (key: string) => {
    setVisibleColumnKeys((prev) =>
      prev.includes(key)
        ? prev.length > 1
          ? prev.filter((k) => k !== key)
          : prev
        : [...prev, key]
    );
  };

  const cellPad = isCompact ? '6px 12px' : undefined;
  const pinBg = 'var(--bg-surface)';

  return (
    <div className="section">
      {/* Header & Control Bar */}
      <div className="section-header" style={{ flexWrap: 'wrap', rowGap: 10 }}>
        <div>
          {title && <h3>{title}</h3>}
          {subtitle && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {/* Search Input */}
          {searchKey && (
            <div style={{ position: 'relative' }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                style={{ width: 220, paddingLeft: 30, fontSize: 12 }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Density Toggle */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsCompact(!isCompact)}
            title={isCompact ? 'Comfortable Density' : 'Compact Density'}
          >
            {isCompact ? 'Comfortable' : 'Compact'}
          </button>

          {/* Column Picker Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowColumnPicker(!showColumnPicker)}
            >
              Columns
            </button>

            {showColumnPicker && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  zIndex: 30,
                  marginTop: 6,
                  width: 190,
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-elevated)',
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Toggle Columns
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 190, overflowY: 'auto' }}>
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        style={{ width: 'auto' }}
                        checked={visibleColumnKeys.includes(col.key)}
                        onChange={() => toggleColumnVisibility(col.key)}
                      />
                      <span>{col.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {renderExpandedRow && <th style={{ width: 40, textAlign: 'center' }} />}
              {activeColumns.map((col) => (
                <th
                  key={col.key}
                  className={col.className}
                  style={{
                    ...(cellPad ? { padding: cellPad } : null),
                    ...(col.pinned === 'left'
                      ? { position: 'sticky', left: 0, zIndex: 2, background: pinBg }
                      : col.pinned === 'right'
                        ? { position: 'sticky', right: 0, zIndex: 2, background: pinBg }
                        : null),
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length + (renderExpandedRow ? 1 : 0)}>
                  <div className="empty">{emptyMessage}</div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIdx) => {
                const absoluteIdx = startIndex + rowIdx;
                const isExpanded = expandedRows[absoluteIdx];

                return (
                  <React.Fragment key={absoluteIdx}>
                    <tr>
                      {renderExpandedRow && (
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '2px 8px' }}
                            onClick={() => toggleRowExpanded(absoluteIdx)}
                            aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                          >
                            {isExpanded ? '▾' : '▸'}
                          </button>
                        </td>
                      )}

                      {activeColumns.map((col) => (
                        <td
                          key={col.key}
                          className={col.className}
                          style={{
                            ...(cellPad ? { padding: cellPad } : null),
                            ...(col.pinned === 'left'
                              ? { position: 'sticky', left: 0, zIndex: 1, background: pinBg }
                              : col.pinned === 'right'
                                ? { position: 'sticky', right: 0, zIndex: 1, background: pinBg }
                                : null),
                          }}
                        >
                          {col.cell(item)}
                        </td>
                      ))}
                    </tr>

                    {/* Collapsible Accordion Row */}
                    {renderExpandedRow && isExpanded && (
                      <tr>
                        <td
                          colSpan={activeColumns.length + 1}
                          style={{ background: 'var(--bg-surface-elevated)' }}
                        >
                          <div style={{ padding: 12 }}>{renderExpandedRow(item)}</div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination Controls */}
      <div
        className="section-header"
        style={{ borderBottom: 'none', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', rowGap: 8 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          <span>Rows per page:</span>
          <div style={{ width: 92 }}>
            <Select
              value={String(pageSize)}
              onChange={(v) => setPageSize(Number(v))}
              options={pageSizeOptions.map((opt) => ({ value: String(opt), label: String(opt) }))}
              searchable={false}
            />
          </div>
          <span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{endIndex}</strong> of{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{totalItems}</strong> items
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            ‹ Prev
          </button>

          <span className="mono" style={{ color: 'var(--text-primary)' }}>
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            className="btn btn-secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}

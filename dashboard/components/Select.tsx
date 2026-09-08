'use client';

import { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  searchable?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
}

const MENU_MAX_HEIGHT = 280;

export function Select({
  id,
  value,
  onChange,
  options,
  searchable = true,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
}: Props) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-enable search for lists with more than 7 items
  const isSearchable = searchable && options.length > 7;

  const filteredOptions = useMemo(() => {
    if (!isSearchable || !searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, searchQuery, isSearchable]);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;

    const updatePlacement = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < MENU_MAX_HEIGHT + 12 && spaceAbove > spaceBelow);
    };

    updatePlacement();
    window.addEventListener('resize', updatePlacement);
    window.addEventListener('scroll', updatePlacement, true);
    return () => {
      window.removeEventListener('resize', updatePlacement);
      window.removeEventListener('scroll', updatePlacement, true);
    };
  }, [open]);

  // Focus search input when menu opens
  useEffect(() => {
    if (open && isSearchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 30);
    }
    if (!open) {
      setSearchQuery('');
    }
  }, [open, isSearchable]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="custom-select" ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`custom-select-trigger${open ? ' open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selected ? '' : 'custom-select-placeholder'}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          className="custom-select-chevron"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className={`custom-select-menu${openUpward ? ' upward' : ''}`}>
          {/* Inline Search Input */}
          {isSearchable && (
            <div className="custom-select-search">
              <svg
                className="custom-select-search-icon"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                className="custom-select-search-input"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="custom-select-search-clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                    searchRef.current?.focus();
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <ul role="listbox" tabIndex={-1} className="custom-select-list">
            {filteredOptions.length === 0 ? (
              <li className="custom-select-empty">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                No results for &ldquo;{searchQuery}&rdquo;
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  className={`custom-select-option${option.value === value ? ' selected' : ''}`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {/* Highlight matched text */}
                  {isSearchable && searchQuery.trim()
                    ? highlightMatch(option.label, searchQuery)
                    : option.label}
                  {option.value === value && (
                    <svg className="custom-select-check" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </li>
              ))
            )}
          </ul>

          {/* Result count when searching */}
          {isSearchable && searchQuery && filteredOptions.length > 0 && (
            <div className="custom-select-count">
              {filteredOptions.length} of {options.length} results
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Wrap matched substring in a <mark> tag for visual highlight */
function highlightMatch(label: string, query: string): React.ReactNode {
  const idx = label.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return label;
  return (
    <>
      {label.slice(0, idx)}
      <mark className="custom-select-highlight">{label.slice(idx, idx + query.length)}</mark>
      {label.slice(idx + query.length)}
    </>
  );
}
'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

const MENU_MAX_HEIGHT = 240;

export function Select({ id, value, onChange, options }: Props) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;

    const updatePlacement = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // Prefer below; flip only if there isn't enough room below but there is above.
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
        <span>{selected?.label ?? ''}</span>
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
        <ul
          className={`custom-select-menu${openUpward ? ' upward' : ''}`}
          role="listbox"
          tabIndex={-1}
        >
          {options.map((option) => (
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
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
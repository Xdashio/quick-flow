import { cookies } from 'next/headers';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000';

/** Server-side authenticated fetch — reads JWT from httpOnly cookie */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('pos_session')?.value;

  const res = await fetch(`${BACKEND}/api${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${path} → ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

/** Format integer cents → KES string, e.g. 150050 → "KES 1,500.50" */
export function formatKes(cents: number): string {
  return `KES ${(cents / 100).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Format ISO date → Nairobi locale string */
export function formatDate(iso: string | Date): string {
  return new Date(iso).toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function nairobiToday(): string {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }),
  )
    .toISOString()
    .slice(0, 10);
}

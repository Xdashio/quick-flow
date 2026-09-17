import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(): string {
  const raw =
    process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://api.crestcyber.co.ke';
  // .env values on cPanel/HostPinnacle often carry trailing whitespace or a
  // trailing slash — either one produces an invalid fetch URL and a failed login.
  return raw.trim().replace(/\/$/, '');
}

// How long to wait for the backend before giving up. Without a timeout a
// hung backend (e.g. DB connect stall) holds the Passenger request open until
// the front proxy kills it with a bare 503 and no usable error message.
const UPSTREAM_TIMEOUT_MS = 10_000;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const backendUrl = getBackendUrl();
  const target = `${backendUrl}/api/auth/login`;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backend connection error';
    const isTimeout =
      err instanceof Error &&
      (err.name === 'TimeoutError' || message.toLowerCase().includes('timeout'));
    console.error(
      `[Login Proxy Error] ${isTimeout ? 'timeout' : 'connection failed'} calling ${backendUrl}:`,
      message,
    );
    // 503 = backend unreachable (Nest app down / DB down / wrong BACKEND_URL).
    // Keep the status distinct from 401 (bad credentials) so the real cause is visible.
    return NextResponse.json(
      {
        message: isTimeout
          ? `Backend server timed out (${backendUrl}). The API app may be stopped or unreachable.`
          : `Failed to connect to backend server (${backendUrl}): ${message}`,
      },
      { status: 503 },
    );
  }

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({ message: 'Login failed' }));
    return NextResponse.json(
      { message: err.message ?? 'Invalid credentials' },
      { status: upstream.status },
    );
  }

  let data: { accessToken?: string; user?: unknown };
  try {
    data = await upstream.json();
  } catch {
    console.error(`[Login Proxy Error] non-JSON response from ${target}`);
    return NextResponse.json(
      { message: 'Backend returned an invalid response' },
      { status: 502 },
    );
  }

  if (!data.accessToken) {
    console.error(`[Login Proxy Error] missing accessToken from ${target}`);
    return NextResponse.json(
      { message: 'Backend returned an invalid response' },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ user: data.user });

  // Set httpOnly cookie — not accessible from JS, secure in production
  response.cookies.set('pos_session', data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours (one shift)
    path: '/',
  });

  return response;
}

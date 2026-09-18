import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';

function getBackendUrl(): string {
  const raw =
    process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3000';
  return raw.trim().replace(/\/$/, '');
}

const UPSTREAM_TIMEOUT_MS = 10_000;

/**
 * Same-origin proxy for client components that need to call the backend
 * with authentication.
 *
 * The session token lives in an httpOnly `pos_session` cookie scoped to
 * *this* app's domain. A client-side fetch straight to the backend's
 * domain (e.g. quickflow-backend.up.railway.app) will never carry that
 * cookie, no matter what `credentials` is set to — cookies don't cross
 * domains. Routing through this same-origin handler lets us read the
 * cookie server-side and forward it to the backend as a Bearer token,
 * without ever exposing the token to client-side JS.
 */
async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const cookieStore = await cookies();
  const token = cookieStore.get('pos_session')?.value;

  // Defense in depth: staff management is admin/manager-only. The dashboard
  // middleware already keeps cashiers off pages, but this stops a cashier
  // token from reaching the user-management API directly through the proxy.
  // (The signature itself was verified by the middleware before we got here.)
  if (path[0] === 'users' && token) {
    try {
      if ((decodeJwt(token) as { role?: string }).role === 'cashier') {
        return NextResponse.json(
          { message: 'Cashiers cannot manage staff accounts.' },
          { status: 403 },
        );
      }
    } catch {
      // Undecodable token — let it through; the backend JWT guard rejects it.
    }
  }

  const BACKEND = getBackendUrl();
  const target = `${BACKEND}/api/${path.join('/')}${req.nextUrl.search}`;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const hasBody = !['GET', 'HEAD'].includes(req.method);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backend connection error';
    console.error(`[Proxy Error] ${req.method} ${target}:`, message);
    return NextResponse.json(
      { message: `Backend unreachable (${BACKEND}): ${message}` },
      { status: 503 },
    );
  }

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PATCH,
  proxy as PUT,
  proxy as DELETE,
};

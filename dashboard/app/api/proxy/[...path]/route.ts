import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000';

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

  const target = `${BACKEND}/api/${path.join('/')}${req.nextUrl.search}`;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const hasBody = !['GET', 'HEAD'].includes(req.method);

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? await req.text() : undefined,
    cache: 'no-store',
  });

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

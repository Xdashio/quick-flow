import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  // Don't fail silently onto the public default — that's how a valid
  // Railway-signed token ends up "invalid" here with no clear signal why.
  console.error(
    '[middleware] JWT_SECRET is not set in this runtime — falling back to the insecure default, tokens signed by the real backend secret will fail verification.',
  );
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production',
);

// TEMP DEBUG — remove after confirming secret parity with backend.
{
  const secret = process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
  console.log(`[debug] JWT_SECRET fingerprint: ${hex} (length ${secret.length})`);
}

const PUBLIC_PATHS = ['/login', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('pos_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (err) {
    // Invalid or expired token — logged so a secret mismatch shows up in
    // Vercel logs instead of just silently bouncing back to /login.
    console.error('[middleware] JWT verify failed:', (err as Error)?.message);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('pos_session');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};
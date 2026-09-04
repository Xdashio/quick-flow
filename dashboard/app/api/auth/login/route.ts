import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3000';

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Proxy credentials to NestJS backend
  const upstream = await fetch(`${BACKEND}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({ message: 'Login failed' }));
    return NextResponse.json(
      { message: err.message ?? 'Invalid credentials' },
      { status: upstream.status },
    );
  }

  const data = await upstream.json();
  const token: string = data.accessToken;

  const response = NextResponse.json({ user: data.user });

  // Set httpOnly cookie — not accessible from JS, secure in production
  response.cookies.set('pos_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours (one shift)
    path: '/',
  });

  return response;
}

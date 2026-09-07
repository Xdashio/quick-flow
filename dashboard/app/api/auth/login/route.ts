import { NextRequest, NextResponse } from 'next/server';

function getBackendUrl(): string {
  const url = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? 'https://api.crestcyber.co.ke';
  return url.replace(/\/$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendUrl = getBackendUrl();

    // Proxy credentials to NestJS backend
    const upstream = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({ message: 'Login failed' }));
      return NextResponse.json(
        { message: err.message ?? 'Invalid credentials' },
        { status: upstream.status }
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backend connection error';
    console.error('[Login Proxy Error]:', message);
    return NextResponse.json(
      { message: `Failed to connect to backend server (${message})` },
      { status: 502 }
    );
  }
}

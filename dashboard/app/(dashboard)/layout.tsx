import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { SidebarNav } from '../../components/SidebarNav';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production',
);

async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('pos_session')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { name: string; role: string; sub: string };
  } catch {
    return null;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="layout">
      <SidebarNav user={user} />
      <main className="main">{children}</main>
    </div>
  );
}

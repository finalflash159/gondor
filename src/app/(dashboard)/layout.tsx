'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (!data.user) {
          router.push('/login');
        } else {
          setUser(data.user);
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <Header user={user} sidebarCollapsed={sidebarCollapsed} />

      <main
        className={`pt-[52px] transition-all duration-300 ${
          sidebarCollapsed ? 'pl-14' : 'pl-[220px]'
        }`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

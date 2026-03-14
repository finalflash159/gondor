'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  ChevronRight,
  Search,
  Bell,
  LogOut,
  User,
  Settings,
  Download,
  Upload,
  Plus,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name?: string | null;
}

interface HeaderProps {
  user: UserData | null;
  sidebarCollapsed?: boolean;
}

export function Header({ user, sidebarCollapsed = false }: HeaderProps) {
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Build breadcrumbs from pathname
  const pathSegments = pathname.split('/').filter(Boolean);

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 h-[52px] border-b border-border bg-card flex items-center justify-between px-6 transition-all duration-300',
        sidebarCollapsed ? 'left-14' : 'left-[220px]'
      )}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5">
        <Link
          href="/organizations"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          minas-tirith
        </Link>
        {pathSegments.slice(1).map((segment, index) => {
          const href = '/' + pathSegments.slice(0, index + 2).join('/');
          const isLast = index === pathSegments.length - 2;
          const label = segment.replace(/-/g, ' ');

          return (
            <span key={href} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              {isLast ? (
                <span className="text-sm font-semibold capitalize text-foreground">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="text-sm capitalize text-muted-foreground hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Import .env */}
        <button className="flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Import .env</span>
        </button>

        {/* Export */}
        <button className="flex items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Add Secret */}
        <button className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90">
          <Plus className="h-3.5 w-3.5" />
          <span>Add Secret</span>
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-border mx-1" />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-md border border-border bg-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-muted"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gold/80 to-gold text-[11px] font-bold text-foreground">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card py-1.5 shadow-xl animate-fadeIn">
                <div className="border-b border-border px-3 pb-2.5 mb-1.5">
                  <p className="text-sm font-semibold text-foreground">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  <User className="h-4 w-4" />
                  Profile
                </button>
                <button className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <div className="border-t border-border mt-1.5 pt-1.5">
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

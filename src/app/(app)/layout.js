'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Sparkles,
  LayoutDashboard,
  PlusCircle,
  History,
  Settings,
  CreditCard,
  Menu,
  LogOut,
  LogIn,
  X,
  Mail,
  Shield,
  FileText,
  Loader2,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

const NAV_ITEMS = [
  {
    label: 'MAIN',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'New Project', href: '/new', icon: PlusCircle },
      { name: 'History', href: '/history', icon: History },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Billing', href: '/billing', icon: CreditCard },
    ],
  },
  {
    label: 'HELP & LEGAL',
    items: [
      { name: 'Contact Us', href: 'mailto:guys4929@gmail.com', icon: Mail },
      { name: 'Privacy Policy', href: '/privacy', icon: Shield, external: true },
      { name: 'Terms of Service', href: '/terms', icon: FileText, external: true },
    ],
  },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/new': 'New Project',
  '/assistant': 'AI Assistant',
  '/history': 'History',
  '/settings': 'Settings',
  '/billing': 'Billing',
  '/results': 'Results',
};

function getPageTitle(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/results/')) return 'Results';
  return 'Dashboard';
}

function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isLoading = status === 'loading';
  const userName = isLoading ? 'Syncing...' : (session?.user?.name || 'Guest');
  const userPlan = isLoading ? 'Loading...' : (session?.user?.plan || 'Guest');
  const initials = isLoading ? '...' : (session?.user?.name ? getInitials(session.user.name) : 'G');

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: '/login' });
  }, []);

  return (
    <>
      <div
        className={`mobile-nav-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/dashboard" className="landing-logo" onClick={onClose}>
            <span className="landing-logo-icon">
              <Sparkles size={18} />
            </span>
            ParserProof
          </Link>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((group) => (
            <div key={group.label} className="sidebar-nav-group">
              <div className="sidebar-nav-label">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isExternal = item.href.startsWith('mailto:') || item.external;
                const isActive =
                  !isExternal &&
                  (pathname === item.href ||
                    (item.href !== '/dashboard' &&
                      pathname.startsWith(item.href + '/')));

                if (isExternal) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                      rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                      id={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="sidebar-nav-item"
                      onClick={onClose}
                    >
                      <span className="sidebar-nav-item-icon">
                        <Icon size={18} />
                      </span>
                      {item.name}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    id={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="sidebar-nav-item-icon">
                      <Icon size={18} />
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px var(--space-4)', gap: 'var(--space-2)', color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
              <Loader2 className="spin" size={14} style={{ animation: 'spin 1.2s linear infinite' }} />
              <span>Verifying session...</span>
            </div>
          ) : (
            <>
              <div className="sidebar-user">
                <div className="sidebar-avatar">{initials}</div>
                <div className="sidebar-user-info">
                  <div className="sidebar-user-name">{userName}</div>
                  <div className="sidebar-user-plan">{userPlan} {userPlan === 'Guest' ? 'Session' : 'Plan'}</div>
                </div>
              </div>
              {session ? (
                <button
                  id="logout-button"
                  className="sidebar-nav-item"
                  onClick={handleLogout}
                  style={{ width: '100%', marginTop: '4px' }}
                >
                  <span className="sidebar-nav-item-icon">
                    <LogOut size={18} />
                  </span>
                  Log out
                </button>
              ) : (
                <Link
                  id="login-button"
                  className="sidebar-nav-item"
                  href="/login"
                  style={{ width: '100%', marginTop: '4px', textDecoration: 'none' }}
                  onClick={onClose}
                >
                  <span className="sidebar-nav-item-icon">
                    <LogIn size={18} />
                  </span>
                  Log in / Sign up
                </Link>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function AppShell({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              id="mobile-menu-toggle"
              className="mobile-nav-toggle"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="topbar-title">{pageTitle}</h1>
          </div>
          <div className="topbar-actions" />
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }) {
  return (
    <AppShell>{children}</AppShell>
  );
}

import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Timer,
  BarChart3,
  Bookmark,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  PlaySquare,
  User as UserIcon,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth, useTheme } from '../hooks';
import { FocusAIPopover } from '../components';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Courses', path: '/courses', icon: BookOpen },
  { label: 'Study Plan', path: '/study-plan', icon: Calendar },
  { label: 'Focus Mode', path: '/focus', icon: Timer },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  { label: 'Notes', path: '/notes', icon: FileText },
];

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Determine current active page label for topbar breadcrumb
  const getCurrentPageLabel = () => {
    const p = location.pathname;
    if (p.startsWith('/dashboard')) return 'Dashboard';
    if (p.startsWith('/courses')) return 'My Courses';
    if (p.startsWith('/study-plan')) return 'Study Plan';
    if (p.startsWith('/focus')) return 'Focus Mode';
    if (p.startsWith('/analytics')) return 'Analytics';
    if (p.startsWith('/bookmarks')) return 'Bookmarks';
    if (p.startsWith('/notes')) return 'Notes & Moments';
    if (p.startsWith('/settings')) return 'Settings';
    if (p.startsWith('/watch')) return 'Watch Workspace';
    return 'Workspace';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-app text-primary font-sans selection:bg-indigo-500/30 selection:text-indigo-300">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-app bg-secondary transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-app px-6">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-200">
              <PlaySquare className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-primary font-heading">
                Focus<span className="text-indigo-500">Tube</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted">
                Workspace
              </span>
            </div>
          </NavLink>
          <button
            type="button"
            className="rounded-lg p-1.5 text-secondary hover:bg-surface-elevated hover:text-primary lg:hidden transition-colors"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted font-heading">
            Navigation
          </p>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold border-l-2 border-indigo-500 shadow-xs'
                      : 'text-secondary hover:bg-surface hover:text-primary border-l-2 border-transparent'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-indigo-500" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Pinned Section: Settings & User Profile */}
        <div className="border-t border-app p-3 space-y-2">
          {/* Settings Nav Item */}
          <NavLink
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold border-l-2 border-indigo-500 shadow-xs'
                  : 'text-secondary hover:bg-surface hover:text-primary border-l-2 border-transparent'
              }`
            }
          >
            <Settings className="h-4 w-4 shrink-0 transition-colors group-hover:text-indigo-500" />
            <span>Settings</span>
          </NavLink>

          {/* User Profile Card */}
          <div className="flex items-center justify-between rounded-xl bg-surface p-2.5 border border-app shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-semibold">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-primary font-heading">
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-50 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-app bg-secondary/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-secondary hover:bg-surface hover:text-primary lg:hidden transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb / Page Title */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary font-heading">
              <span>{getCurrentPageLabel()}</span>
            </div>

            <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                Distraction-Free Focus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-app bg-surface text-secondary hover:text-primary hover:border-indigo-500/40 transition-all cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
              )}
            </button>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-primary font-heading">{user?.name}</p>
              <p className="text-[11px] text-muted">{user?.email}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 rounded-xl border border-app bg-surface px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary hover:border-indigo-500/30 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Content Scroll View */}
        <main className="flex-1 overflow-y-auto bg-app bg-ambient-glow p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Contextual Floating Assistant */}
      <FocusAIPopover />
    </div>
  );
};

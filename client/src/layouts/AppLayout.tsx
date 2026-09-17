import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../hooks';
import { FocusAIPopover } from '../components';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'My Courses', path: '/courses', icon: BookOpen },
  { label: 'Study Plan', path: '/study-plan', icon: Calendar },
  { label: 'Focus Mode', path: '/focus', icon: Timer },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
  { label: 'Notes', path: '/notes', icon: FileText },
  { label: 'Settings', path: '/settings', icon: Settings },
];

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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

  return (
    <div className="flex h-screen overflow-hidden bg-[#0F172A] text-slate-100 font-sans">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Mobile Drawer) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/[0.08] bg-[#0B1120] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/[0.08] px-6">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
              <PlaySquare className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white font-heading">
                Focus<span className="text-indigo-400">Tube</span>
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Learning SaaS
              </span>
            </div>
          </NavLink>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-indigo-500/12 text-indigo-300 font-semibold border-l-2 border-indigo-500 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100 border-l-2 border-transparent'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 transition-colors group-hover:text-indigo-300" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Footer Profile & Sign Out */}
        <div className="border-t border-white/[0.08] p-3">
          <div className="flex items-center justify-between rounded-xl bg-slate-900/60 p-2.5 border border-white/[0.06]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                <UserIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-[11px] text-slate-400">
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
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-rose-400 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-white/[0.08] bg-[#0B1120]/70 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-medium text-slate-400">
                Distraction-Free YouTube Learning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-200">{user?.name}</p>
              <p className="text-[11px] text-slate-400">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#0F172A] p-4 sm:p-6 lg:p-8">
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

import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import {
  Menu,
  Sun,
  Moon,
  Laptop,
  LogOut,
  User as UserIcon,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobile }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Poll system health every 30 seconds
  const { data: healthData, isError: isHealthError } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => settingsApi.getHealth(),
    refetchInterval: 30000,
    staleTime: 20000,
  });

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format breadcrumb title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path.startsWith('/products/new')) return 'Create Garment Specification';
    if (path.startsWith('/products/edit')) return 'Edit Garment';
    if (path.startsWith('/products')) return 'Product Catalogue';
    if (path.startsWith('/categories')) return 'Categories & Capsule Collections';
    if (path.startsWith('/commissions/')) return 'Client Bespoke Dossier';
    if (path.startsWith('/commissions')) return 'Bespoke Commissions';
    if (path.startsWith('/reviews')) return 'Client Review Moderation';
    if (path.startsWith('/bespoke-studio')) return 'Bespoke Custom Studio Options';
    if (path.startsWith('/cms')) return 'Homepage Modular Sections';
    if (path.startsWith('/testimonials')) return 'Client Testimonials';
    if (path.startsWith('/social-looks')) return 'Social Looks & Media Feed';
    if (path.startsWith('/subscribers')) return 'Newsletter Subscribers';
    if (path.startsWith('/media')) return 'Media Asset Library';
    if (path.startsWith('/settings')) return 'Store Configuration';
    if (path.startsWith('/users')) return 'Staff Administration';
    if (path.startsWith('/profile')) return 'My Account & Security';
    return 'Atelier Administration';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-surface border-b border-theme flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 text-muted hover:text-primary rounded-lg hover:bg-surface-hover"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title & Breadcrumbs */}
        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-semibold font-serif-luxury text-primary tracking-wide">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Health Status Badge */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-theme bg-surface-subtle/50"
          title={`Backend status: ${healthData?.status || 'Active'}, DB: ${healthData?.database || 'Connected'}`}
        >
          {isHealthError ? (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-rose-500">API Offline</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-secondary text-[11px] font-mono">
                {healthData?.database === 'connected' ? 'Postgres Active' : 'API Ready'}
              </span>
            </>
          )}
        </div>

        {/* Theme Switcher Dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="p-2 rounded-xl text-muted hover:text-primary hover:bg-surface-hover transition-colors"
            title="Switch Theme"
          >
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-amber-400" />
            ) : theme === 'light' ? (
              <Sun className="w-5 h-5 text-amber-600" />
            ) : (
              <Laptop className="w-5 h-5" />
            )}
          </button>

          {isThemeOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-xl bg-surface border border-theme shadow-xl py-1.5 z-50 text-xs">
              <button
                onClick={() => {
                  setTheme('light');
                  setIsThemeOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover ${
                  theme === 'light' ? 'text-amber-500 font-semibold' : 'text-primary'
                }`}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
              <button
                onClick={() => {
                  setTheme('dark');
                  setIsThemeOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover ${
                  theme === 'dark' ? 'text-amber-500 font-semibold' : 'text-primary'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
              <button
                onClick={() => {
                  setTheme('system');
                  setIsThemeOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover ${
                  theme === 'system' ? 'text-amber-500 font-semibold' : 'text-primary'
                }`}
              >
                <Laptop className="w-4 h-4" /> System
              </button>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl hover:bg-surface-hover border border-theme transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-xs">
              {user?.firstName?.[0] || 'A'}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-primary">
              {user?.firstName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-surface border border-theme shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-theme">
                <p className="text-xs font-semibold text-primary truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-muted truncate">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 uppercase font-semibold">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-primary hover:bg-surface-hover"
                >
                  <UserIcon className="w-4 h-4 text-muted" />
                  Account & Password
                </Link>
              </div>

              <div className="border-t border-theme pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

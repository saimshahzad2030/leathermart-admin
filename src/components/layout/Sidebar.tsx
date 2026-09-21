import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Layers,
  FolderTree,
  FileText,
  Star,
  Sliders,
  Sparkles,
  MessageSquareQuote,
  Camera,
  Mail,
  Image,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const navigationSections: NavSection[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      title: 'Catalogue',
      items: [
        { label: 'Products', href: '/products', icon: Layers },
        { label: 'Categories & Capsules', href: '/categories', icon: FolderTree },
      ],
    },
    {
      title: 'Atelier & Clients',
      items: [
        { label: 'Bespoke Commissions', href: '/commissions', icon: FileText },
        { label: 'Review Moderation', href: '/reviews', icon: Star },
        { label: 'Bespoke Studio Options', href: '/bespoke-studio', icon: Sliders },
      ],
    },
    {
      title: 'Content & CMS',
      items: [
        { label: 'Homepage Sections', href: '/cms', icon: Sparkles },
        { label: 'Client Testimonials', href: '/testimonials', icon: MessageSquareQuote },
        { label: 'Social Looks', href: '/social-looks', icon: Camera },
        { label: 'Subscribers', href: '/subscribers', icon: Mail },
      ],
    },
    {
      title: 'System & Admin',
      items: [
        { label: 'Media Library', href: '/media', icon: Image },
        { label: 'Store Settings', href: '/settings', icon: Settings },
        // Users page is strictly super_admin only
        ...(hasRole(['super_admin'])
          ? [{ label: 'Staff Accounts', href: '/users', icon: Users }]
          : []),
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface border-r border-theme select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-theme shrink-0">
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <span className="font-serif-luxury font-bold text-amber-500 text-base">AV</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate">
              <span className="font-serif-luxury font-bold text-sm tracking-wider text-primary truncate">
                VALENTI MILANO
              </span>
              <span className="text-[10px] tracking-widest text-muted uppercase font-mono">
                Executive Admin
              </span>
            </div>
          )}
        </NavLink>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-muted hover:text-primary hover:bg-surface-hover transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navigationSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted/70 mb-2">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? location.pathname === item.href
                : location.pathname.startsWith(item.href);

              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group relative',
                    isActive
                      ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 font-semibold'
                      : 'text-secondary hover:text-primary hover:bg-surface-hover'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5 shrink-0 transition-colors',
                      isActive ? 'text-amber-500 dark:text-amber-400' : 'text-muted group-hover:text-primary'
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-amber-500" />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer User Mini Bar */}
      <div className="p-3 border-t border-theme shrink-0">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-xl bg-surface-subtle/50 border border-theme-subtle',
            isCollapsed && 'justify-center p-2'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center shrink-0 text-xs">
            {user?.firstName?.[0] || 'A'}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col truncate min-w-0">
              <span className="text-xs font-semibold text-primary truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-muted flex items-center gap-1 uppercase tracking-wide">
                <ShieldCheck className="w-3 h-3 text-amber-500 shrink-0" />
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden lg:block h-screen sticky top-0 transition-all duration-300 z-30',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Container */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-surface shadow-2xl z-10 transition-transform animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

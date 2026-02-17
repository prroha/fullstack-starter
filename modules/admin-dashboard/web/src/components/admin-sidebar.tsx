'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// =============================================================================
// Types
// =============================================================================

export interface NavItem {
  /** Display label */
  label: string;
  /** Link href */
  href: string;
  /** Icon component */
  icon?: React.ReactNode;
  /** Badge content (e.g., count) */
  badge?: string | number;
  /** Disabled state */
  disabled?: boolean;
  /** Required permission */
  permission?: string;
}

export interface NavGroup {
  /** Group title */
  title?: string;
  /** Items in the group */
  items: NavItem[];
}

export interface AdminSidebarProps {
  /** Navigation groups */
  navigation: NavGroup[];
  /** App name/logo */
  appName?: string;
  /** Logo component */
  logo?: React.ReactNode;
  /** User permissions (for filtering) */
  permissions?: string[];
  /** Collapsed state */
  collapsed?: boolean;
  /** Handler for collapse toggle */
  onCollapseToggle?: () => void;
  /** Footer content */
  footer?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Default Icons
// =============================================================================

const Icons = {
  Dashboard: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  ),
  Users: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  Settings: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  Activity: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  ),
  ChevronLeft: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  ),
  ChevronRight: (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  ),
};

// =============================================================================
// Default Navigation
// =============================================================================

export const defaultAdminNavigation: NavGroup[] = [
  {
    items: [
      {
        label: 'Dashboard',
        href: '/admin',
        icon: Icons.Dashboard,
        permission: 'stats:read',
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        label: 'Users',
        href: '/admin/users',
        icon: Icons.Users,
        permission: 'users:read',
      },
      {
        label: 'Activity',
        href: '/admin/activity',
        icon: Icons.Activity,
        permission: 'activity:read',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Settings',
        href: '/admin/settings',
        icon: Icons.Settings,
        permission: 'settings:read',
      },
    ],
  },
];

// =============================================================================
// Nav Item Component
// =============================================================================

function NavItemComponent({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  if (item.disabled) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground cursor-not-allowed',
          collapsed && 'justify-center'
        )}
        title={collapsed ? item.label : undefined}
      >
        {item.icon}
        {!collapsed && <span className="text-sm">{item.label}</span>}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        collapsed && 'justify-center'
      )}
      title={collapsed ? item.label : undefined}
    >
      {item.icon}
      {!collapsed && (
        <>
          <span className="text-sm flex-1">{item.label}</span>
          {item.badge !== undefined && (
            <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AdminSidebar({
  navigation = defaultAdminNavigation,
  appName = 'Admin',
  logo,
  permissions = [],
  collapsed = false,
  onCollapseToggle,
  footer,
  className,
}: AdminSidebarProps) {
  const pathname = usePathname();

  // Filter items based on permissions
  const filterByPermission = (items: NavItem[]): NavItem[] => {
    if (permissions.length === 0) return items;
    return items.filter(
      (item) => !item.permission || permissions.includes(item.permission)
    );
  };

  return (
    <aside
      className={cn(
        'flex flex-col bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-border',
          collapsed ? 'justify-center' : 'gap-3'
        )}
      >
        {logo || (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">
              {appName[0].toUpperCase()}
            </span>
          </div>
        )}
        {!collapsed && (
          <span className="font-semibold text-foreground">{appName}</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navigation.map((group, groupIndex) => {
          const filteredItems = filterByPermission(group.items);
          if (filteredItems.length === 0) return null;

          return (
            <div key={groupIndex}>
              {group.title && !collapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/admin' && pathname.startsWith(item.href));

                  return (
                    <NavItemComponent
                      key={item.href}
                      item={item}
                      isActive={isActive}
                      collapsed={collapsed}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {(footer || onCollapseToggle) && (
        <div className="border-t border-border p-4">
          {footer}
          {onCollapseToggle && (
            <Button
              variant="ghost"
              onClick={onCollapseToggle}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground h-auto',
                collapsed && 'justify-center'
              )}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? Icons.ChevronRight : Icons.ChevronLeft}
              {!collapsed && <span>Collapse</span>}
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}

export default AdminSidebar;

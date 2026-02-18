"use client";

import { usePreviewContext } from "@preview/lib/preview-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  feature: string;
  label: string;
  href: string;
}

const CORE_NAV_ITEMS: NavItem[] = [
  { feature: "core", label: "Dashboard", href: "/" },
  { feature: "core", label: "Profile", href: "/profile" },
  { feature: "core", label: "Settings", href: "/settings" },
];

const MODULE_NAV_ITEMS: NavItem[] = [
  { feature: "ecommerce", label: "Products", href: "/products" },
  { feature: "ecommerce", label: "Cart", href: "/cart" },
  { feature: "lms", label: "Courses", href: "/courses" },
  { feature: "helpdesk", label: "Support", href: "/helpdesk" },
  { feature: "booking", label: "Booking", href: "/booking" },
  { feature: "invoicing", label: "Invoices", href: "/invoices" },
  { feature: "events", label: "Events", href: "/events" },
  { feature: "tasks", label: "Tasks", href: "/tasks" },
];

export function PreviewNav() {
  const { hasModule } = usePreviewContext();
  const pathname = usePathname();

  const enabledModules = MODULE_NAV_ITEMS.filter(
    (item) => item.feature === "core" || hasModule(item.feature)
  );

  const allItems = [...CORE_NAV_ITEMS, ...enabledModules];

  return (
    <nav className="w-64 bg-card border-r border-border min-h-screen p-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground">Preview App</h2>
        <p className="text-xs text-muted-foreground">Live preview of your configuration</p>
      </div>
      <ul className="space-y-1">
        {allItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

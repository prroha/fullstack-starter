"use client";

import { usePreviewContext } from "@preview/lib/preview-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavSection {
  feature: string;
  label: string;
  items: { label: string; href: string }[];
}

const CORE_SECTION: NavSection = {
  feature: "core",
  label: "Core",
  items: [
    { label: "Dashboard", href: "/" },
    { label: "Login", href: "/login" },
  ],
};

const MODULE_SECTIONS: NavSection[] = [
  {
    feature: "ecommerce",
    label: "E-Commerce",
    items: [
      { label: "Shop", href: "/shop" },
      { label: "Cart", href: "/cart" },
      { label: "Orders", href: "/dashboard/orders" },
      { label: "Seller Dashboard", href: "/dashboard/seller" },
      { label: "My Products", href: "/dashboard/seller/products" },
    ],
  },
  {
    feature: "lms",
    label: "LMS",
    items: [
      { label: "Courses", href: "/courses" },
      { label: "My Courses", href: "/dashboard/my-courses" },
      { label: "Instructor", href: "/dashboard/instructor" },
    ],
  },
  {
    feature: "booking",
    label: "Booking",
    items: [
      { label: "Services", href: "/services" },
      { label: "Providers", href: "/providers" },
      { label: "My Bookings", href: "/dashboard/my-bookings" },
      { label: "Provider Panel", href: "/dashboard/provider" },
    ],
  },
  {
    feature: "helpdesk",
    label: "Helpdesk",
    items: [
      { label: "Dashboard", href: "/helpdesk" },
      { label: "Tickets", href: "/helpdesk/tickets" },
      { label: "Knowledge Base", href: "/helpdesk/knowledge-base" },
      { label: "Agents", href: "/helpdesk/agents" },
    ],
  },
  {
    feature: "invoicing",
    label: "Invoicing",
    items: [
      { label: "Dashboard", href: "/invoicing" },
      { label: "Invoices", href: "/invoicing/invoices" },
      { label: "Clients", href: "/invoicing/clients" },
      { label: "Recurring", href: "/invoicing/recurring" },
    ],
  },
  {
    feature: "events",
    label: "Events",
    items: [
      { label: "Overview", href: "/events" },
      { label: "Event List", href: "/events/list" },
      { label: "Calendar", href: "/events/calendar" },
      { label: "Venues", href: "/events/venues" },
      { label: "Registrations", href: "/events/registrations" },
    ],
  },
  {
    feature: "tasks",
    label: "Tasks",
    items: [
      { label: "Overview", href: "/tasks" },
      { label: "List View", href: "/tasks/list" },
      { label: "Board View", href: "/tasks/board" },
      { label: "Projects", href: "/tasks/projects" },
      { label: "Labels", href: "/tasks/labels" },
    ],
  },
];

export function PreviewNav() {
  const { hasModule, isLoading } = usePreviewContext();
  const pathname = usePathname();

  if (isLoading) return null;

  const enabledSections = MODULE_SECTIONS.filter((s) => hasModule(s.feature));
  const sections = [CORE_SECTION, ...enabledSections];

  return (
    <nav className="w-56 shrink-0 bg-card border-r border-border min-h-screen p-4 overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-foreground">Preview</h2>
      </div>
      {sections.map((section) => (
        <div key={section.feature} className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-3">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
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
        </div>
      ))}
    </nav>
  );
}

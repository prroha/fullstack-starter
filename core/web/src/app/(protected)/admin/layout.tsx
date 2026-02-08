"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Spinner } from "@/components/ui";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: "chart-bar" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/messages", label: "Messages", icon: "mail" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "clipboard-list" },
];

/**
 * Admin layout that requires ADMIN role.
 * Redirects to home if user is not an admin.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAdmin, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.push("/");
    }
  }, [isAdmin, isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Spinner size="lg" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
              <span className="font-semibold">Admin Panel</span>
            </Link>
          </div>

          <nav className="flex items-center gap-1 ml-6">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1" />

          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to App
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

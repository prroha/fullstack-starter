"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Layers } from "lucide-react";
import { useState } from "react";
import { Button, ThemeToggle, Container } from "@/components/ui";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/showcase", label: "Components" },
  { href: "/configure", label: "Configure" },
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Starter Studio</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  isActive(link.href)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle variant="icon" size="sm" />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/admin">Admin</Link>
            </Button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/configure">Start Building</Link>
            </Button>

            {/* Mobile Menu Button - 44px min touch target */}
            <button
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <Container>
            <nav className="flex flex-col py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 min-h-[44px] flex items-center rounded-md text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <Button asChild variant="outline" className="min-h-[44px]">
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    Admin
                  </Link>
                </Button>
                <Button asChild className="min-h-[44px]">
                  <Link href="/configure" onClick={() => setMobileMenuOpen(false)}>
                    Start Building
                  </Link>
                </Button>
              </div>
            </nav>
          </Container>
        </div>
      )}
    </header>
  );
}

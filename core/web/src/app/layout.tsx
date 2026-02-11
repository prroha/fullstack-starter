import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider, ThemeScript } from "@/lib/theme-context";
import { FeatureFlagsProvider } from "@/lib/feature-flags";
import { Toaster } from "@/components/feedback";
import { SkeletonPage } from "@/components/ui";

// Preview mode flag - only enabled in preview environments
// In downloaded apps, this will be false and preview banner won't be shown
const PREVIEW_MODE = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true";

// Conditionally import preview banner (only in preview mode)
// This component is in _preview/ directory and excluded from downloads
const PreviewBanner = PREVIEW_MODE
  ? require("@/components/_preview/preview-banner").PreviewBanner
  : () => null;

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My App",
  description: "Built with Fullstack Starter Template",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultColorMode="system" defaultTheme="edu">
          <FeatureFlagsProvider>
            <PreviewBanner />
            <AuthProvider>
              <Suspense fallback={<SkeletonPage />}>
                {children}
              </Suspense>
              <Toaster position="top-right" richColors closeButton />
            </AuthProvider>
          </FeatureFlagsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

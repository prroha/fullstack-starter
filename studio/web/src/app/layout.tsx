import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider, ThemeScript } from "@core/components/providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Starter Studio - Build Your SaaS in Days",
    template: "%s | Starter Studio",
  },
  description:
    "Configure, preview, and download production-ready fullstack applications. Build your SaaS with 112+ components, modular features, and enterprise-ready code.",
  keywords: [
    "SaaS starter kit",
    "fullstack template",
    "React components",
    "Next.js boilerplate",
    "Flutter mobile app",
    "production-ready code",
  ],
  authors: [{ name: "Starter Studio" }],
  creator: "Starter Studio",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Starter Studio",
    title: "Starter Studio - Build Your SaaS in Days",
    description:
      "Configure, preview, and download production-ready fullstack applications with 112+ components and modular features.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Starter Studio - Build Your SaaS in Days",
    description:
      "Configure, preview, and download production-ready fullstack applications.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}

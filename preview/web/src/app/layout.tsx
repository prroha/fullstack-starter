import type { Metadata } from "next";
import "./globals.css";
import { PreviewProvider } from "@preview/lib/preview-context";
import { PreviewBanner } from "@preview/components/preview-banner";
import { PreviewNav } from "@preview/components/preview-nav";
import { FetchInterceptor } from "@preview/components/fetch-interceptor";

export const metadata: Metadata = {
  title: "Live Preview | Xitolaunch",
  description: "Interactive live preview of your configured application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PreviewProvider>
          <FetchInterceptor />
          <PreviewBanner />
          <div className="flex min-h-screen">
            <PreviewNav />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </PreviewProvider>
      </body>
    </html>
  );
}

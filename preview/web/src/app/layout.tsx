import type { Metadata } from "next";
import "./globals.css";
import { PreviewProvider } from "@preview/lib/preview-context";
import { PreviewBanner } from "@preview/components/preview-banner";

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
          <PreviewBanner />
          <main>{children}</main>
        </PreviewProvider>
      </body>
    </html>
  );
}

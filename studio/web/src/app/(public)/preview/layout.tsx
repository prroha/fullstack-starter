import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Preview",
  description:
    "Preview your configured SaaS application in real-time. Test responsive layouts across desktop, tablet, and mobile devices. See your features in action before you download.",
  openGraph: {
    title: "Live Preview | Xitolaunch",
    description:
      "See your configured application working before you buy. Preview responsive layouts and test all selected features in action.",
  },
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Minimal layout for preview (no header/footer)
  return <div className="min-h-screen bg-background">{children}</div>;
}

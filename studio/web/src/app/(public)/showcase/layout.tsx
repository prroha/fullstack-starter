import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Component Showcase",
  description:
    "Browse our library of 114 production-ready UI components built with React, TypeScript, and Tailwind CSS. Filter by tier, category, and tags to find exactly what you need.",
  openGraph: {
    title: "Component Showcase | Starter Studio",
    description:
      "Explore 114 production-ready React components. Buttons, forms, modals, dashboards, and more. Built with TypeScript and Tailwind CSS.",
  },
};

export default function ShowcaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

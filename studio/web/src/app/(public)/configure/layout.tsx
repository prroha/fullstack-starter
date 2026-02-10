import type { Metadata } from "next";
import { ConfiguratorProvider } from "@/components/configurator";

export const metadata: Metadata = {
  title: "Configure Your App",
  description:
    "Build your custom SaaS application by selecting from 50+ modular features including authentication, payments, storage, and more. Choose a pricing tier and get production-ready code.",
  openGraph: {
    title: "Configure Your App | Starter Studio",
    description:
      "Select features, choose your template, and configure your custom fullstack application. From authentication to payments, pick only what you need.",
  },
};

export default function ConfigureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConfiguratorProvider>{children}</ConfiguratorProvider>;
}

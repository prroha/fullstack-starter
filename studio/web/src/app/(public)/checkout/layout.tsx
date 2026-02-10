import { ConfiguratorProvider } from "@/components/configurator";

export const metadata = {
  title: "Checkout - Starter Studio",
  description: "Complete your order and get instant access to your custom starter kit",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ConfiguratorProvider>{children}</ConfiguratorProvider>;
}

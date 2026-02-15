import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutContent } from "./checkout-content";
import CheckoutLoading from "./loading";

export const metadata: Metadata = {
  title: "Checkout - Xitolaunch",
  description:
    "Complete your purchase and get instant access to your customized starter kit. Secure payment powered by Stripe.",
  openGraph: {
    title: "Checkout | Xitolaunch",
    description:
      "Secure checkout for your customized starter kit. Get instant access after payment.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}

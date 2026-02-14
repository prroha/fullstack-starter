"use client";

import { useRouter } from "next/navigation";
import { recurringApi } from "@/lib/invoicing/api";
import RecurringForm from "@/components/invoicing/recurring-form";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { RecurringCreateInput } from "@/lib/invoicing/types";

export default function NewRecurringPage() {
  const router = useRouter();

  const handleSubmit = async (data: RecurringCreateInput) => {
    const recurring = await recurringApi.create(data as RecurringCreateInput);
    router.push(`/invoicing/recurring/${recurring.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Invoicing", href: "/invoicing" },
            { label: "Recurring", href: "/invoicing/recurring" },
            { label: "New Recurring Invoice" },
          ]}
        />

        <h1 className="mt-6 text-2xl font-bold text-foreground">
          New Recurring Invoice
        </h1>
        <p className="mt-1 text-muted-foreground">
          Set up automatic billing for a client
        </p>

        <div className="mt-8">
          <RecurringForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/invoicing/recurring")}
          />
        </div>
      </div>
    </div>
  );
}

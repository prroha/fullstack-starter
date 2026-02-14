"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clientApi } from "@/lib/invoicing/api";
import type { ClientCreateInput } from "@/lib/invoicing/types";
import ClientForm from "@/components/invoicing/client-form";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function NewClientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ClientCreateInput) => {
    setIsSubmitting(true);
    try {
      const client = await clientApi.create(data);
      router.push(`/invoicing/clients/${client.id}`);
    } catch (err) {
      setIsSubmitting(false);
      throw err instanceof Error ? err : new Error("Failed to create client");
    }
  };

  const handleCancel = () => {
    router.push("/invoicing/clients");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: "Invoicing", href: "/invoicing" },
              { label: "Clients", href: "/invoicing/clients" },
              { label: "New Client" },
            ]}
            className="mb-4"
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            New Client
          </h1>
          <p className="mt-1 text-muted-foreground">
            Add a new client to your invoicing contacts
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-border bg-card p-6">
          <ClientForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}

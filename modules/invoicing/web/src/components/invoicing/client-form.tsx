"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/feedback/alert";
import type { InvoicingClient, ClientCreateInput } from "../../lib/invoicing/types";

interface ClientFormProps {
  client?: InvoicingClient | null;
  onSubmit: (data: ClientCreateInput) => Promise<void>;
  onCancel?: () => void;
}

export default function ClientForm({
  client,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const [name, setName] = useState(client?.name ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [companyName, setCompanyName] = useState(client?.companyName ?? "");
  const [taxId, setTaxId] = useState(client?.taxId ?? "");
  const [notes, setNotes] = useState(client?.notes ?? "");

  // Address fields
  const [line1, setLine1] = useState(client?.billingAddress?.line1 ?? "");
  const [line2, setLine2] = useState(client?.billingAddress?.line2 ?? "");
  const [city, setCity] = useState(client?.billingAddress?.city ?? "");
  const [state, setState] = useState(client?.billingAddress?.state ?? "");
  const [postalCode, setPostalCode] = useState(client?.billingAddress?.postalCode ?? "");
  const [country, setCountry] = useState(client?.billingAddress?.country ?? "");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const hasAddress = line1.trim() || city.trim();
      const data: ClientCreateInput = {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        companyName: companyName.trim() || undefined,
        taxId: taxId.trim() || undefined,
        notes: notes.trim() || undefined,
        billingAddress: hasAddress
          ? {
              line1: line1.trim(),
              line2: line2.trim() || undefined,
              city: city.trim(),
              state: state.trim(),
              postalCode: postalCode.trim(),
              country: country.trim(),
            }
          : undefined,
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save client");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" required>
              Client Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxId">Tax ID</Label>
          <Input
            id="taxId"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="XX-XXXXXXX"
          />
        </div>
      </div>

      {/* Billing Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Billing Address</h3>

        <div className="space-y-2">
          <Label htmlFor="line1">Street Address</Label>
          <Input
            id="line1"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="123 Main St"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="line2">Address Line 2</Label>
          <Input
            id="line2"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="Suite 100"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="New York"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">State / Province</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="NY"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="10001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="US"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes about this client..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          {client ? "Update Client" : "Create Client"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert } from "@/components/feedback/alert";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { settingsApi, taxRateApi } from "@/lib/invoicing/api";
import { CURRENCY_OPTIONS } from "@/lib/invoicing/constants";
import type { InvoicingSettings, TaxRate, TaxRateCreateInput } from "@/lib/invoicing/types";

export default function InvoicingSettingsPage() {
  const [settings, setSettings] = useState<InvoicingSettings | null>(null);
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Settings fields
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [invoicePrefix, setInvoicePrefix] = useState("INV");
  const [defaultCurrency, setDefaultCurrency] = useState("usd");
  const [defaultDueDays, setDefaultDueDays] = useState("30");
  const [defaultTerms, setDefaultTerms] = useState("");
  const [defaultNotes, setDefaultNotes] = useState("");

  // Address fields
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPostalCode, setAddrPostalCode] = useState("");
  const [addrCountry, setAddrCountry] = useState("");

  // New tax rate
  const [newTaxName, setNewTaxName] = useState("");
  const [newTaxRate, setNewTaxRate] = useState("");
  const [isAddingTax, setIsAddingTax] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [settingsData, taxData] = await Promise.all([
        settingsApi.get(),
        taxRateApi.list(),
      ]);
      setSettings(settingsData);
      setTaxRates(taxData);

      // Populate fields
      setBusinessName(settingsData.businessName ?? "");
      setBusinessEmail(settingsData.businessEmail ?? "");
      setBusinessPhone(settingsData.businessPhone ?? "");
      setInvoicePrefix(settingsData.invoicePrefix);
      setDefaultCurrency(settingsData.defaultCurrency);
      setDefaultDueDays(String(settingsData.defaultDueDays));
      setDefaultTerms(settingsData.defaultTerms ?? "");
      setDefaultNotes(settingsData.defaultNotes ?? "");
      setAddrLine1(settingsData.businessAddress?.line1 ?? "");
      setAddrLine2(settingsData.businessAddress?.line2 ?? "");
      setAddrCity(settingsData.businessAddress?.city ?? "");
      setAddrState(settingsData.businessAddress?.state ?? "");
      setAddrPostalCode(settingsData.businessAddress?.postalCode ?? "");
      setAddrCountry(settingsData.businessAddress?.country ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const hasAddress = addrLine1.trim() || addrCity.trim();
      await settingsApi.update({
        businessName: businessName.trim() || undefined,
        businessEmail: businessEmail.trim() || undefined,
        businessPhone: businessPhone.trim() || undefined,
        invoicePrefix: invoicePrefix.trim() || undefined,
        defaultCurrency,
        defaultDueDays: parseInt(defaultDueDays, 10) || 30,
        defaultTerms: defaultTerms.trim() || undefined,
        defaultNotes: defaultNotes.trim() || undefined,
        businessAddress: hasAddress
          ? {
              line1: addrLine1.trim(),
              line2: addrLine2.trim() || undefined,
              city: addrCity.trim(),
              state: addrState.trim(),
              postalCode: addrPostalCode.trim(),
              country: addrCountry.trim(),
            }
          : undefined,
      });
      setSuccess("Settings saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTaxRate = async () => {
    if (!newTaxName.trim() || !newTaxRate) return;
    setIsAddingTax(true);
    try {
      const rate = await taxRateApi.create({
        name: newTaxName.trim(),
        rate: parseFloat(newTaxRate),
      });
      setTaxRates([...taxRates, rate]);
      setNewTaxName("");
      setNewTaxRate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add tax rate");
    } finally {
      setIsAddingTax(false);
    }
  };

  const handleDeleteTaxRate = async (id: string) => {
    try {
      await taxRateApi.delete(id);
      setTaxRates(taxRates.filter((tr) => tr.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tax rate");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await taxRateApi.setDefault(id);
      setTaxRates(
        taxRates.map((tr) => ({
          ...tr,
          isDefault: tr.id === id,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Invoicing", href: "/invoicing" },
            { label: "Settings" },
          ]}
        />

        <h1 className="mt-6 text-2xl font-bold text-foreground">
          Invoicing Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure your business details and invoice defaults
        </p>

        <div className="mt-8 space-y-8">
          {error && <Alert variant="error">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* Business Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Business Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your Business Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="billing@yourbusiness.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessPhone">Business Phone</Label>
              <Input
                id="businessPhone"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Business Address */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Business Address
            </h2>

            <div className="space-y-2">
              <Label htmlFor="sAddrLine1">Street Address</Label>
              <Input
                id="sAddrLine1"
                value={addrLine1}
                onChange={(e) => setAddrLine1(e.target.value)}
                placeholder="123 Main St"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sAddrLine2">Address Line 2</Label>
              <Input
                id="sAddrLine2"
                value={addrLine2}
                onChange={(e) => setAddrLine2(e.target.value)}
                placeholder="Suite 100"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sCity">City</Label>
                <Input
                  id="sCity"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sState">State / Province</Label>
                <Input
                  id="sState"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  placeholder="NY"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sPostalCode">Postal Code</Label>
                <Input
                  id="sPostalCode"
                  value={addrPostalCode}
                  onChange={(e) => setAddrPostalCode(e.target.value)}
                  placeholder="10001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sCountry">Country</Label>
                <Input
                  id="sCountry"
                  value={addrCountry}
                  onChange={(e) => setAddrCountry(e.target.value)}
                  placeholder="US"
                />
              </div>
            </div>
          </div>

          {/* Invoice Defaults */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Invoice Defaults
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                <Input
                  id="invoicePrefix"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="INV"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default Currency</Label>
                <Select
                  value={defaultCurrency}
                  onChange={setDefaultCurrency}
                  options={CURRENCY_OPTIONS}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultDueDays">Default Due Days</Label>
                <Input
                  id="defaultDueDays"
                  type="number"
                  min="1"
                  value={defaultDueDays}
                  onChange={(e) => setDefaultDueDays(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultTerms">Default Terms</Label>
              <Textarea
                id="defaultTerms"
                value={defaultTerms}
                onChange={(e) => setDefaultTerms(e.target.value)}
                placeholder="Payment is due within 30 days of invoice date..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultNotes">Default Notes</Label>
              <Textarea
                id="defaultNotes"
                value={defaultNotes}
                onChange={(e) => setDefaultNotes(e.target.value)}
                placeholder="Thank you for your business!"
                rows={2}
              />
            </div>
          </div>

          <Button onClick={handleSave} isLoading={isSaving}>
            Save Settings
          </Button>

          {/* Tax Rates */}
          <div className="space-y-4 border-t border-border pt-8">
            <h2 className="text-lg font-semibold text-foreground">
              Tax Rates
            </h2>

            {taxRates.length > 0 && (
              <div className="space-y-2">
                {taxRates.map((tr) => (
                  <div
                    key={tr.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">
                        {tr.name}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {tr.rate}%
                      </span>
                      {tr.isDefault && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!tr.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetDefault(tr.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTaxRate(tr.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add new tax rate */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label htmlFor="newTaxName">Tax Name</Label>
                <Input
                  id="newTaxName"
                  value={newTaxName}
                  onChange={(e) => setNewTaxName(e.target.value)}
                  placeholder="e.g. Sales Tax"
                />
              </div>
              <div className="w-28 space-y-1">
                <Label htmlFor="newTaxRate">Rate (%)</Label>
                <Input
                  id="newTaxRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newTaxRate}
                  onChange={(e) => setNewTaxRate(e.target.value)}
                  placeholder="8.5"
                />
              </div>
              <Button
                onClick={handleAddTaxRate}
                isLoading={isAddingTax}
                disabled={!newTaxName.trim() || !newTaxRate}
              >
                Add Tax Rate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CreditCard,
  Tag,
  Lock,
  Package,
  Check,
  AlertCircle,
  Gift,
  ExternalLink,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Input,
  Label,
  Badge,
  Divider,
  Spinner,
  Container,
} from "@/components/ui";
import { useConfigurator } from "@/components/configurator";
import { parseURLConfig } from "@/lib/config";
import { getTierName, TIER_INFO } from "@/lib/pricing";
import { studioApi, type ValidateCouponResponse } from "@/lib/api/studio-client";

// Billing form state - simplified for Stripe Checkout
interface BillingInfo {
  email: string;
  firstName: string;
  lastName: string;
}

const initialBillingInfo: BillingInfo = {
  email: "",
  firstName: "",
  lastName: "",
};

export function CheckoutContent() {
  const searchParams = useSearchParams();
  const {
    loading,
    error,
    features,
    selectedTier,
    selectedFeatures,
    selectedTemplate,
    pricing,
    setTier,
    setFeatures,
    setTemplate,
    getCurrentTier,
    isFeatureIncludedInTier,
    formatPrice,
  } = useConfigurator();

  // Local state
  const [initialized, setInitialized] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponData, setCouponData] = useState<ValidateCouponResponse["coupon"] | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(initialBillingInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BillingInfo, string>>>({});

  // Check for cancelled checkout
  useEffect(() => {
    const cancelled = searchParams.get("cancelled");
    if (cancelled === "true") {
      setSubmitError("Checkout was cancelled. You can try again when ready.");
    }
  }, [searchParams]);

  // Initialize from URL on mount
  useEffect(() => {
    if (initialized || loading) return;

    const urlConfig = parseURLConfig(searchParams);

    if (urlConfig.tier) {
      setTier(urlConfig.tier);
    }
    if (urlConfig.features) {
      setFeatures(urlConfig.features);
    }
    if (urlConfig.template) {
      setTemplate(urlConfig.template);
    }

    setInitialized(true);
  }, [searchParams, initialized, loading, setTier, setFeatures, setTemplate]);

  // Get current tier object
  const currentTier = getCurrentTier();

  // Get add-on features (not included in tier)
  const addOnFeatures = useMemo(() => {
    return selectedFeatures
      .filter((slug) => !isFeatureIncludedInTier(slug))
      .map((slug) => features.find((f) => f.slug === slug))
      .filter((f): f is NonNullable<typeof f> => f !== undefined);
  }, [selectedFeatures, features, isFeatureIncludedInTier]);

  // Get template name if selected
  const selectedTemplateName = useMemo(() => {
    if (!selectedTemplate) return null;
    // Template lookup would happen here - for now return formatted slug
    return selectedTemplate
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, [selectedTemplate]);

  // Calculate coupon discount display
  const couponDiscountDisplay = useMemo(() => {
    if (!couponData) return null;
    if (couponData.type === "PERCENTAGE") {
      return `-${couponData.value}%`;
    }
    return `-${formatPrice(couponData.value)}`;
  }, [couponData, formatPrice]);

  // Handle coupon code validation via API
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      const result = await studioApi.validateCoupon(
        couponCode,
        pricing?.subtotal
      );

      if (result.valid && result.coupon) {
        setCouponApplied(true);
        setCouponData(result.coupon);
        setCouponError(null);
      } else {
        setCouponError(result.error || "Invalid or expired coupon code");
        setCouponApplied(false);
        setCouponData(null);
      }
    } catch (err) {
      setCouponError("Failed to validate coupon. Please try again.");
      setCouponApplied(false);
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponApplied(false);
    setCouponData(null);
    setCouponError(null);
  };

  // Handle billing info change
  const handleBillingChange = (field: keyof BillingInfo, value: string) => {
    setBillingInfo((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    // Clear submit error
    if (submitError) {
      setSubmitError(null);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof BillingInfo, string>> = {};

    if (!billingInfo.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingInfo.email)) {
      errors.email = "Please enter a valid email";
    }

    if (!billingInfo.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!billingInfo.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle order submission - redirects to Stripe Checkout
  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await studioApi.createCheckoutSession({
        tier: selectedTier,
        selectedFeatures,
        templateId: selectedTemplate || undefined,
        email: billingInfo.email,
        customerName: `${billingInfo.firstName} ${billingInfo.lastName}`.trim(),
        couponCode: couponApplied ? couponCode : undefined,
      });

      // Redirect to Stripe Checkout
      window.location.href = result.url;
    } catch (err) {
      console.error("Checkout session creation failed:", err);
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Failed to start checkout. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container className="py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading checkout...</p>
          </div>
        </div>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container className="py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-destructive mb-2">
                Failed to Load Checkout
              </h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button asChild variant="outline">
                <Link href="/configure">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Configure
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  // No tier selected state
  if (!currentTier) {
    return (
      <Container className="py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Configuration Selected</h2>
              <p className="text-muted-foreground mb-4">
                Please configure your starter kit before proceeding to checkout.
              </p>
              <Button asChild>
                <Link href="/configure">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Configure Your App
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/configure?tier=${selectedTier}&features=${selectedFeatures.join(",")}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Configure
        </Link>
        <h1 className="text-3xl font-bold">Checkout</h1>
        <p className="text-muted-foreground mt-2">
          Review your order and proceed to secure payment
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submit Error Alert */}
          {submitError && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="py-4">
                <div className="flex items-start gap-3" role="alert">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-destructive">Checkout Error</p>
                    <p className="text-sm text-muted-foreground mt-1">{submitError}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                We&apos;ll send your license and download links to this email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={billingInfo.email}
                  onChange={(e) => handleBillingChange("email", e.target.value)}
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? "email-error" : undefined}
                  autoComplete="email"
                />
                {formErrors.email && (
                  <p id="email-error" className="text-sm text-destructive" role="alert">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Name Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive" aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={billingInfo.firstName}
                    onChange={(e) => handleBillingChange("firstName", e.target.value)}
                    aria-invalid={!!formErrors.firstName}
                    aria-describedby={formErrors.firstName ? "firstName-error" : undefined}
                    autoComplete="given-name"
                  />
                  {formErrors.firstName && (
                    <p id="firstName-error" className="text-sm text-destructive" role="alert">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive" aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={billingInfo.lastName}
                    onChange={(e) => handleBillingChange("lastName", e.target.value)}
                    aria-invalid={!!formErrors.lastName}
                    aria-describedby={formErrors.lastName ? "lastName-error" : undefined}
                    autoComplete="family-name"
                  />
                  {formErrors.lastName && (
                    <p id="lastName-error" className="text-sm text-destructive" role="alert">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coupon Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" aria-hidden="true" />
                Coupon Code
              </CardTitle>
              <CardDescription>Have a discount code? Enter it here</CardDescription>
            </CardHeader>
            <CardContent>
              {couponApplied && couponData ? (
                <div className="flex items-center justify-between p-3 bg-success/10 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-success" aria-hidden="true" />
                    <span className="font-medium text-success">
                      {couponData.code}
                    </span>
                    <Badge variant="success" size="sm">
                      {couponDiscountDisplay} off
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveCoupon}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyCoupon();
                        }
                      }}
                      aria-invalid={!!couponError}
                      aria-describedby={couponError ? "coupon-error" : undefined}
                    />
                    {couponError && (
                      <p id="coupon-error" className="text-sm text-destructive mt-1" role="alert">
                        {couponError}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                  >
                    {couponLoading ? <Spinner size="sm" /> : "Apply"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
                Payment
              </CardTitle>
              <CardDescription>
                Secure payment processing powered by Stripe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-medium">Secure Checkout</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You will be securely redirected to Stripe to complete your payment.
                  Stripe accepts all major credit cards, debit cards, and digital wallets.
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex gap-2 text-muted-foreground" aria-label="Accepted payment methods">
                    <span className="text-xs bg-muted px-2 py-1 rounded">Visa</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Mastercard</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Amex</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Apple Pay</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">Google Pay</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Selected Tier */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {getTierName(selectedTier)}
                      </Badge>
                      <span className="text-sm font-medium">Tier</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentTier.includedFeatures.length} features included
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(pricing?.tierPrice || currentTier.price)}
                  </span>
                </div>

                {/* Selected Template */}
                {selectedTemplateName && (
                  <>
                    <Divider />
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-sm font-medium">Template</span>
                        <p className="text-sm text-muted-foreground">
                          {selectedTemplateName}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">Included</span>
                    </div>
                  </>
                )}

                {/* Add-on Features */}
                {addOnFeatures.length > 0 && (
                  <>
                    <Divider />
                    <div>
                      <span className="text-sm font-medium">
                        Add-on Features ({addOnFeatures.length})
                      </span>
                      <div className="mt-2 space-y-2">
                        {addOnFeatures.map((feature) => (
                          <div
                            key={feature.slug}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {feature.name}
                            </span>
                            <span>{formatPrice(feature.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Divider />

                {/* Pricing Breakdown */}
                {pricing && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(pricing.subtotal)}</span>
                    </div>

                    {/* Bundle Discounts */}
                    {pricing.bundleDiscounts.length > 0 &&
                      pricing.bundleDiscounts.map((discount) => (
                        <div
                          key={discount.id}
                          className="flex justify-between text-success"
                        >
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" aria-hidden="true" />
                            {discount.name}
                          </span>
                          <span>-{formatPrice(discount.amount)}</span>
                        </div>
                      ))}

                    {/* Coupon Discount */}
                    {couponApplied && couponData && (
                      <div className="flex justify-between text-success">
                        <span className="flex items-center gap-1">
                          <Gift className="h-3 w-3" aria-hidden="true" />
                          Coupon: {couponData.code}
                        </span>
                        <span>
                          {couponData.discountAmount
                            ? `-${formatPrice(couponData.discountAmount)}`
                            : couponDiscountDisplay}
                        </span>
                      </div>
                    )}

                    {/* Total Savings */}
                    {(pricing.totalDiscount > 0 || (couponApplied && couponData)) && (
                      <>
                        <Divider className="my-2" />
                        <div className="flex justify-between text-success font-medium">
                          <span>You Save</span>
                          <span>
                            -{formatPrice(
                              pricing.totalDiscount +
                                (couponData?.discountAmount || 0)
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Tax */}
                    {pricing.tax > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatPrice(pricing.tax)}</span>
                      </div>
                    )}

                    <Divider className="my-2" />

                    {/* Total */}
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>
                        {formatPrice(
                          Math.max(
                            0,
                            pricing.total - (couponData?.discountAmount || 0)
                          )
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* One-time Payment Note */}
                <p className="text-xs text-muted-foreground text-center">
                  One-time payment. Lifetime access to code and updates.
                </p>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                {/* Complete Order Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Redirecting to Stripe...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
                      Proceed to Payment
                    </>
                  )}
                </Button>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  <span>Secure checkout powered by Stripe</span>
                </div>
              </CardFooter>
            </Card>

            {/* What You Get */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">What You Get</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Full source code access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Lifetime updates and improvements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Use for unlimited projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Documentation and setup guides</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
                    <span>Community support access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}

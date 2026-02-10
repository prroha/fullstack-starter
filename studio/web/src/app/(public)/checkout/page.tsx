"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

// Payment method options
const PAYMENT_METHODS = [
  { id: "card", name: "Credit Card", icon: CreditCard, description: "Visa, Mastercard, Amex" },
  { id: "paypal", name: "PayPal", icon: Package, description: "Pay with PayPal" },
] as const;

type PaymentMethod = typeof PAYMENT_METHODS[number]["id"];

// Billing form state
interface BillingInfo {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  country: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

const initialBillingInfo: BillingInfo = {
  email: "",
  firstName: "",
  lastName: "",
  company: "",
  country: "US",
  address: "",
  city: "",
  state: "",
  zip: "",
};

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    loading,
    error,
    features,
    tiers,
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
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [billingInfo, setBillingInfo] = useState<BillingInfo>(initialBillingInfo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BillingInfo, string>>>({});

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

  // Handle coupon code application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError(null);

    try {
      // TODO: Replace with actual API call to validate coupon
      // const response = await fetch(`/api/coupons/validate?code=${couponCode}`);
      // const data = await response.json();

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // For demo purposes, accept specific codes
      if (couponCode.toUpperCase() === "SAVE10" || couponCode.toUpperCase() === "LAUNCH") {
        setCouponApplied(true);
        setCouponError(null);
      } else {
        setCouponError("Invalid or expired coupon code");
        setCouponApplied(false);
      }
    } catch {
      setCouponError("Failed to validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  // Handle coupon removal
  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponApplied(false);
    setCouponError(null);
  };

  // Handle billing info change
  const handleBillingChange = (field: keyof BillingInfo, value: string) => {
    setBillingInfo((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
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

    if (!billingInfo.country.trim()) {
      errors.country = "Country is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle order submission
  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual Stripe/payment integration
      // const response = await fetch("/api/orders", {
      //   method: "POST",
      //   body: JSON.stringify({
      //     tier: selectedTier,
      //     features: selectedFeatures,
      //     template: selectedTemplate,
      //     couponCode: couponApplied ? couponCode : undefined,
      //     billing: billingInfo,
      //     paymentMethod,
      //   }),
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirect to success page
      router.push("/checkout/success");
    } catch {
      // Handle error
      console.error("Order submission failed");
    } finally {
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
          Review your order and complete your purchase
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Enter your billing details for the invoice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={billingInfo.email}
                  onChange={(e) => handleBillingChange("email", e.target.value)}
                  aria-invalid={!!formErrors.email}
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email}</p>
                )}
              </div>

              {/* Name Row */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={billingInfo.firstName}
                    onChange={(e) => handleBillingChange("firstName", e.target.value)}
                    aria-invalid={!!formErrors.firstName}
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-destructive">{formErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={billingInfo.lastName}
                    onChange={(e) => handleBillingChange("lastName", e.target.value)}
                    aria-invalid={!!formErrors.lastName}
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-destructive">{formErrors.lastName}</p>
                  )}
                </div>
              </div>

              {/* Company (optional) */}
              <div className="space-y-2">
                <Label htmlFor="company">Company (optional)</Label>
                <Input
                  id="company"
                  placeholder="Acme Inc."
                  value={billingInfo.company}
                  onChange={(e) => handleBillingChange("company", e.target.value)}
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country">
                  Country <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="country"
                  placeholder="United States"
                  value={billingInfo.country}
                  onChange={(e) => handleBillingChange("country", e.target.value)}
                  aria-invalid={!!formErrors.country}
                />
                {formErrors.country && (
                  <p className="text-sm text-destructive">{formErrors.country}</p>
                )}
              </div>

              {/* Address (optional for digital products) */}
              <div className="space-y-2">
                <Label htmlFor="address">Address (optional)</Label>
                <Input
                  id="address"
                  placeholder="123 Main St"
                  value={billingInfo.address}
                  onChange={(e) => handleBillingChange("address", e.target.value)}
                />
              </div>

              {/* City, State, Zip Row */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="San Francisco"
                    value={billingInfo.city}
                    onChange={(e) => handleBillingChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    placeholder="CA"
                    value={billingInfo.state}
                    onChange={(e) => handleBillingChange("state", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP/Postal Code</Label>
                  <Input
                    id="zip"
                    placeholder="94102"
                    value={billingInfo.zip}
                    onChange={(e) => handleBillingChange("zip", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coupon Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Coupon Code
              </CardTitle>
              <CardDescription>Have a discount code? Enter it here</CardDescription>
            </CardHeader>
            <CardContent>
              {couponApplied ? (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-700 dark:text-green-400">
                      {couponCode.toUpperCase()}
                    </span>
                    <Badge variant="success" size="sm">
                      Applied
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
                      aria-invalid={!!couponError}
                    />
                    {couponError && (
                      <p className="text-sm text-destructive mt-1">{couponError}</p>
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

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
              <CardDescription>Select how you would like to pay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`
                        flex items-center gap-3 p-4 rounded-lg border-2 transition-colors text-left
                        ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        }
                      `}
                    >
                      <div
                        className={`
                          flex items-center justify-center w-10 h-10 rounded-full
                          ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}
                        `}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{method.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {method.description}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-primary ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Stripe Card Element Placeholder */}
              {paymentMethod === "card" && (
                <div className="mt-4 p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm font-medium">Secure Payment via Stripe</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Card payment form will be loaded here via Stripe Elements.
                    Your payment information is securely processed by Stripe.
                  </p>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="mt-4 p-4 border border-dashed border-muted-foreground/30 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    You will be redirected to PayPal to complete your payment after clicking
                    &quot;Complete Order&quot;.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
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
                    <p className="text-sm text-muted-foreground mt-1">
                      {TIER_INFO[selectedTier as keyof typeof TIER_INFO]?.description ||
                        "Base tier with core features"}
                    </p>
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
                          className="flex justify-between text-green-600"
                        >
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {discount.name}
                          </span>
                          <span>-{formatPrice(discount.amount)}</span>
                        </div>
                      ))}

                    {/* Coupon Discount */}
                    {couponApplied && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          Coupon: {couponCode.toUpperCase()}
                        </span>
                        <span>-10%</span>
                      </div>
                    )}

                    {/* Total Savings */}
                    {(pricing.totalDiscount > 0 || couponApplied) && (
                      <>
                        <Divider className="my-2" />
                        <div className="flex justify-between text-green-600 font-medium">
                          <span>You Save</span>
                          <span>
                            -{formatPrice(pricing.totalDiscount)}
                            {couponApplied && " + 10%"}
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
                      <span>{formatPrice(pricing.total)}</span>
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
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Complete Order
                    </>
                  )}
                </Button>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
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
                    <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Full source code access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Lifetime updates and improvements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Use for unlimited projects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Documentation and setup guides</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
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

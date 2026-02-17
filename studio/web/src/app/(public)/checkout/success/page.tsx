"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Download,
  Key,
  BookOpen,
  HeadphonesIcon,
  ArrowRight,
  Copy,
  Check,
  Package,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Loader2,
  Mail,
  FileCode,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Divider,
  Spinner,
  Container,
} from "@/components/ui";
import { API_CONFIG } from "@/lib/constants";

// Order status type
type OrderStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";

// Order details interface
interface OrderDetails {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string | null;
  tier: string;
  total: number;
  discount: number;
  status: OrderStatus;
  selectedFeatures: string[];
  template: {
    id: string;
    name: string;
    slug: string;
  } | null;
  license: {
    id: string;
    status: string;
    downloadCount: number;
    maxDownloads: number;
    licenseKey: string;
  } | null;
  paidAt: string | null;
  createdAt: string;
}

// Download state
type DownloadState = "idle" | "loading" | "success" | "error";

// Success page content component that uses useSearchParams
function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Support session_id (Stripe callback), order_id (webhook) and order (legacy) params
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id") || searchParams.get("order");

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [downloadState, setDownloadState] = useState<DownloadState>("idle");
  const [sessionStatus, setSessionStatus] = useState<"pending" | "complete" | "expired" | null>(null);

  // Fetch order details from API
  const fetchOrderDetails = useCallback(async () => {
    // If we have a Stripe session ID, first check the session status
    if (sessionId && !orderId) {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_CONFIG.BASE_URL}/checkout/session/${sessionId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || "Failed to check session status");
        }

        const data = await response.json();
        const status = data.data?.status;
        setSessionStatus(status);

        if (status === "complete" && data.data?.orderNumber) {
          // Session complete, now fetch order details by order number
          const orderResponse = await fetch(`${API_CONFIG.BASE_URL}/orders/by-number/${data.data.orderNumber}`, {
            credentials: "include",
          });

          if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            setOrder(orderData.data);
          } else {
            // Order might not be created yet, show success message anyway
            setError(null);
          }
        } else if (status === "expired") {
          setError("This checkout session has expired. Please try again.");
        }
        // If pending, the UI will show a polling state
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check payment status");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!orderId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to load order details");
      }

      const data = await response.json();
      setOrder(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [orderId, sessionId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Redirect if no order param
  useEffect(() => {
    if (!orderId && !loading) {
      setIsRedirecting(true);
      const timer = setTimeout(() => {
        router.push("/configure");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [orderId, loading, router]);

  // Handle copy license key
  const handleCopyLicense = async () => {
    if (!order?.license?.licenseKey) return;

    try {
      await navigator.clipboard.writeText(order.license.licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!orderId) return;

    try {
      setDownloadState("loading");

      // Create a download link
      const downloadUrl = `${API_CONFIG.BASE_URL}/orders/${orderId}/download`;

      // Use fetch to get the file with credentials
      const response = await fetch(downloadUrl, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Download failed");
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `xitolaunch-${order?.tier}-${order?.orderNumber}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadState("success");

      // Refresh order to update download count
      await fetchOrderDetails();

      // Reset download state after a delay
      setTimeout(() => {
        setDownloadState("idle");
      }, 3000);
    } catch (err) {
      setDownloadState("error");
      console.error("Download error:", err);

      // Reset download state after a delay
      setTimeout(() => {
        setDownloadState("idle");
      }, 3000);
    }
  };

  // Format price
  const formatPrice = (cents: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));
  };

  // Show redirect message if no order and no session
  if (!orderId && !sessionId && !loading) {
    return (
      <Container className="py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="py-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Order Found</h2>
              <p className="text-muted-foreground mb-4">
                We could not find an order to display. Redirecting you to configure your starter kit...
              </p>
              {isRedirecting && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Spinner size="sm" />
                  <span>Redirecting...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Container className="py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading your order...</p>
          </div>
        </div>
      </Container>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <Container className="py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Order</h2>
              <p className="text-muted-foreground mb-6">
                {error || "Failed to load order details. Please try again."}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={fetchOrderDetails}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
                <Button asChild>
                  <Link href="/configure">Start New Configuration</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  // Session pending state - show processing message
  if (sessionId && sessionStatus === "pending" && !order) {
    return (
      <Container className="py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardContent className="py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Confirming Your Payment</h2>
              <p className="text-muted-foreground mb-4">
                We&apos;re processing your payment. This usually takes just a moment...
              </p>
              <Button variant="outline" onClick={fetchOrderDetails}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  // Session complete but no order yet - show success with limited info
  if (sessionId && sessionStatus === "complete" && !order) {
    return (
      <Container className="py-8 md:py-12">
        <div className="text-center mb-10 md:mb-12">
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 animate-ping rounded-full bg-success/20" style={{ animationDuration: "2s" }} />
            <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-warning" />
            <Badge variant="success" size="lg">
              Payment Successful
            </Badge>
            <Sparkles className="h-5 w-5 text-warning" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Thank You for Your Purchase!
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Your payment has been confirmed. You will receive an email with your download link and license key shortly.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="py-6 space-y-4">
              <p className="text-center text-muted-foreground">
                Your order is being prepared. Check your email for the download link and license key.
              </p>
              <div className="flex flex-col gap-3">
                <Button asChild>
                  <Link href="/configure">
                    Configure Another Project
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/support">
                    <HeadphonesIcon className="mr-2 h-4 w-4" />
                    Contact Support
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  // Order not completed state - poll for completion
  if (order && order.status !== "COMPLETED") {
    return (
      <Container className="py-12">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardContent className="py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Processing Your Order</h2>
              <p className="text-muted-foreground mb-4">
                Your order is being processed. This usually takes a few seconds.
              </p>
              <Badge variant="secondary" className="mb-6">
                Status: {order.status}
              </Badge>
              <p className="text-sm text-muted-foreground mb-4">
                Order Number: {order.orderNumber}
              </p>
              <Button variant="outline" onClick={fetchOrderDetails}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Status
              </Button>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  const tierName = order.tier.charAt(0).toUpperCase() + order.tier.slice(1);

  return (
    <Container className="py-8 md:py-12">
      {/* Success Header */}
      <div className="text-center mb-10 md:mb-12">
        {/* Animated Success Icon */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 animate-ping rounded-full bg-success/20" style={{ animationDuration: "2s" }} />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-warning" />
          <Badge variant="success" size="lg">
            Payment Successful
          </Badge>
          <Sparkles className="h-5 w-5 text-warning" />
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          Thank You for Your Purchase!
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Your order has been confirmed and your starter kit is ready for download.
          A confirmation email has been sent to {order.customerEmail}.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Left Column - Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Download Card */}
          <Card className="border-success/20 bg-success/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Download Your Starter Kit
              </CardTitle>
              <CardDescription>
                Your customized starter kit is ready to download
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
                <div className="flex items-center gap-3">
                  <FileCode className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-medium">
                      Xitolaunch - {tierName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.template?.name || "Custom Configuration"} | {order.selectedFeatures.length} features
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleDownload}
                  disabled={downloadState === "loading"}
                  size="lg"
                >
                  {downloadState === "loading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : downloadState === "success" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Downloaded!
                    </>
                  ) : downloadState === "error" ? (
                    <>
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Retry Download
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download ZIP
                    </>
                  )}
                </Button>
              </div>

              {order.license && (
                <p className="text-sm text-muted-foreground text-center">
                  {order.license.downloadCount} of {order.license.maxDownloads} downloads used
                </p>
              )}
            </CardContent>
          </Card>

          {/* Order Receipt */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Order Receipt</CardTitle>
                  <CardDescription>
                    Order #{order.orderNumber}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{formatDate(order.paidAt || order.createdAt)}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Summary */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{tierName} Tier</span>
                  <span className="font-semibold">{formatPrice(order.total)}</span>
                </div>
                {order.template && (
                  <p className="text-sm text-muted-foreground mb-1">
                    Template: {order.template.name}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  Includes full source code, lifetime updates, and all tier features.
                </p>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount Applied</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}

              <Divider />

              {/* License Key */}
              {order.license && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">License Key</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-sm overflow-hidden text-ellipsis">
                      {order.license.licenseKey}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLicense}
                      className="shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Keep this key safe. You will need it for support requests and future downloads.
                  </p>
                </div>
              )}

              <Divider />

              {/* Receipt sent to */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>Receipt sent to {order.customerEmail}</span>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
              <CardDescription>
                Get started with your new starter kit in minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Download Code */}
                <Button onClick={handleDownload} disabled={downloadState === "loading"} size="lg" className="h-auto py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-foreground/20">
                      <Download className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Download Code</div>
                      <div className="text-xs opacity-80">
                        Get your source files
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>

                {/* View Documentation */}
                <Button asChild variant="outline" size="lg" className="h-auto py-4">
                  <Link href="https://docs.xitolaunch.com" target="_blank" rel="noopener noreferrer">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Documentation</div>
                        <div className="text-xs text-muted-foreground">
                          Setup guides and tutorials
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>

                {/* License Management */}
                <Button asChild variant="outline" size="lg" className="h-auto py-4">
                  <Link href="/dashboard/licenses">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        <Key className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Manage License</div>
                        <div className="text-xs text-muted-foreground">
                          View and manage your license
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>

                {/* Contact Support */}
                <Button asChild variant="outline" size="lg" className="h-auto py-4">
                  <Link href="/support">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        <HeadphonesIcon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">Contact Support</div>
                        <div className="text-xs text-muted-foreground">
                          Get help when you need it
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Tips */}
        <div className="space-y-6">
          {/* Quick Start Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Start Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium">Extract the code</p>
                  <p className="text-xs text-muted-foreground">
                    Unzip the downloaded file to your projects folder
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium">Install dependencies</p>
                  <p className="text-xs text-muted-foreground">
                    Run <code className="bg-muted px-1 rounded">npm install</code> or <code className="bg-muted px-1 rounded">pnpm install</code>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium">Configure environment</p>
                  <p className="text-xs text-muted-foreground">
                    Copy <code className="bg-muted px-1 rounded">.env.example</code> to <code className="bg-muted px-1 rounded">.env</code> and update values
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                  4
                </div>
                <div>
                  <p className="text-sm font-medium">Start developing</p>
                  <p className="text-xs text-muted-foreground">
                    Run <code className="bg-muted px-1 rounded">npm run dev</code> and open localhost:3000
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What is Included */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What is Included</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Full source code access</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Lifetime updates included</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Use for unlimited projects</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Complete documentation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Community support</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Card className="bg-muted/30">
            <CardContent className="py-4">
              <p className="text-sm text-center text-muted-foreground">
                Need help getting started?{" "}
                <Link href="/support" className="text-primary hover:underline font-medium">
                  Contact our support team
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}

// Loading fallback for Suspense
function CheckoutSuccessLoading() {
  return (
    <Container className="py-12">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading your order...</p>
        </div>
      </div>
    </Container>
  );
}

// Main export with Suspense wrapper
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<CheckoutSuccessLoading />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}

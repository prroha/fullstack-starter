"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import { certificateApi } from "@/lib/lms/api";
import type { Certificate, CertificateVerification } from "@/lib/lms/types";

// =============================================================================
// Helper Functions
// =============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// =============================================================================
// Certificate View Page
// =============================================================================

export default function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const verifyCode = searchParams.get("verify");

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [verification, setVerification] =
    useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  const fetchCertificate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (verifyCode) {
        // Verification mode: verify the certificate by code
        const verificationResult = await certificateApi.verify(verifyCode);
        setVerification(verificationResult);
        if (verificationResult.valid && verificationResult.certificate) {
          setCertificate(verificationResult.certificate);
          // Also fetch QR code for display
          try {
            const qr = await certificateApi.getQrCode(
              verificationResult.certificate.id,
            );
            setQrCodeData(qr.qrCode);
          } catch {
            // QR code is non-critical
          }
        }
      } else {
        // Direct view mode: fetch certificate by ID
        const [cert, qr] = await Promise.allSettled([
          certificateApi.get(id),
          certificateApi.getQrCode(id),
        ]);

        if (cert.status === "fulfilled") {
          setCertificate(cert.value);
        } else {
          throw new Error(
            cert.reason instanceof Error
              ? cert.reason.message
              : "Failed to load certificate",
          );
        }

        if (qr.status === "fulfilled") {
          setQrCodeData(qr.value.qrCode);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load certificate",
      );
    } finally {
      setLoading(false);
    }
  }, [id, verifyCode]);

  useEffect(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  // ---------------------------------------------------------------------------
  // Download Handler
  // ---------------------------------------------------------------------------

  const handleDownloadPdf = useCallback(() => {
    if (!certificate) return;
    const downloadUrl = certificateApi.getDownloadUrl(certificate.id);
    window.open(downloadUrl, "_blank");
  }, [certificate]);

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <button
            onClick={fetchCertificate}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Verification Failed State
  // ---------------------------------------------------------------------------

  if (verifyCode && verification && !verification.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Verification Failed
          </h1>
          <p className="mt-3 text-muted-foreground">
            This certificate verification code is invalid or the certificate
            does not exist. Please check the code and try again.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Verification code:{" "}
            <code className="rounded bg-muted px-2 py-0.5 font-mono text-foreground">
              {verifyCode}
            </code>
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // No Certificate State
  // ---------------------------------------------------------------------------

  if (!certificate) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Certificate not found.</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render Certificate
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Verification Banner */}
        {verifyCode && verification?.valid && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-5 py-4">
            <svg
              className="h-6 w-6 flex-shrink-0 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <div>
              <p className="font-medium text-green-800">
                Certificate Verified
              </p>
              <p className="text-sm text-green-700">
                This certificate is authentic and has been verified
                successfully.
              </p>
            </div>
          </div>
        )}

        {/* Certificate Card */}
        <div className="overflow-hidden rounded-xl border-2 border-border bg-card shadow-lg">
          {/* Decorative Top Border */}
          <div className="h-2 bg-gradient-to-r from-primary via-primary/70 to-primary" />

          <div className="p-8 sm:p-12 text-center space-y-6">
            {/* Title */}
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Certificate of Completion
              </p>
            </div>

            {/* Decorative Divider */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-16 bg-border" />
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              <div className="h-px w-16 bg-border" />
            </div>

            {/* This certifies that */}
            <p className="text-sm text-muted-foreground">
              This is to certify that
            </p>

            {/* Student Name */}
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              {certificate.studentName}
            </h1>

            {/* Has completed */}
            <p className="text-sm text-muted-foreground">
              has successfully completed the course
            </p>

            {/* Course Title */}
            <h2 className="text-xl font-semibold text-primary sm:text-2xl">
              {certificate.courseTitle}
            </h2>

            {/* Date and Issuer */}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Issued on {formatDate(certificate.issuedAt)}
              </p>
              <p className="text-sm text-muted-foreground">
                By {certificate.issuerName}
              </p>
            </div>

            {/* Decorative Divider */}
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-24 bg-border" />
              <div className="h-px w-24 bg-border" />
            </div>

            {/* QR Code */}
            {qrCodeData && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={qrCodeData}
                  alt="Certificate verification QR code"
                  className="h-28 w-28"
                />
                <p className="text-xs text-muted-foreground">
                  Scan to verify
                </p>
              </div>
            )}

            {/* Verification Code */}
            <div className="rounded-lg bg-muted/50 px-4 py-3 inline-block">
              <p className="text-xs text-muted-foreground">
                Verification Code
              </p>
              <p className="mt-0.5 font-mono text-sm font-medium text-foreground tracking-wider">
                {certificate.verificationCode}
              </p>
            </div>
          </div>

          {/* Decorative Bottom Border */}
          <div className="h-2 bg-gradient-to-r from-primary via-primary/70 to-primary" />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Download PDF */}
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>

          {/* Share / Copy Link */}
          <button
            onClick={() => {
              const url = `${window.location.origin}/certificates/${certificate.id}?verify=${certificate.verificationCode}`;
              navigator.clipboard.writeText(url).catch(() => {
                // Fallback: prompt the user
                window.prompt("Copy this link:", url);
              });
            }}
            className="flex items-center gap-2 rounded-lg border border-input px-6 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Copy Verification Link
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-input px-6 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
        </div>

        {/* Certificate Info */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="mb-4 font-semibold text-foreground">
            Certificate Details
          </h3>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Certificate ID</dt>
              <dd className="mt-0.5 font-mono text-sm text-foreground">
                {certificate.id}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Verification Code
              </dt>
              <dd className="mt-0.5 font-mono text-sm text-foreground">
                {certificate.verificationCode}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Student</dt>
              <dd className="mt-0.5 text-sm text-foreground">
                {certificate.studentName}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Course</dt>
              <dd className="mt-0.5 text-sm text-foreground">
                {certificate.courseTitle}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Issued By</dt>
              <dd className="mt-0.5 text-sm text-foreground">
                {certificate.issuerName}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Issue Date</dt>
              <dd className="mt-0.5 text-sm text-foreground">
                {formatDate(certificate.issuedAt)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

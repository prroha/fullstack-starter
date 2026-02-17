'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Certificate } from '../../lib/lms/types';

interface CertificateCardProps {
  certificate: Certificate;
}

export default function CertificateCard({ certificate }: CertificateCardProps) {
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString(
    undefined,
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }
  );

  const verificationUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/certificates/verify/${certificate.verificationCode}`
      : '';

  function handleDownload() {
    if (certificate.pdfUrl) {
      window.open(certificate.pdfUrl, '_blank', 'noopener,noreferrer');
    }
  }

  function handleShare(method: 'copy' | 'twitter' | 'linkedin') {
    const shareText = `I earned a certificate for completing "${certificate.courseTitle}"!`;

    switch (method) {
      case 'copy': {
        navigator.clipboard.writeText(verificationUrl).then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        });
        break;
      }
      case 'twitter': {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(verificationUrl)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'linkedin': {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`;
        window.open(linkedinUrl, '_blank', 'noopener,noreferrer');
        break;
      }
    }

    setShareMenuOpen(false);
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Certificate visual card */}
      <div className="relative bg-card border-2 border-warning/30 rounded-xl overflow-hidden shadow-lg">
        {/* Decorative top border */}
        <div className="h-2 bg-gradient-to-r from-warning via-warning/60 to-warning" />

        {/* Certificate content */}
        <div className="px-8 py-10 text-center">
          {/* Decorative seal icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </div>

          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            Certificate of Completion
          </p>

          <h2 className="text-xl font-bold text-foreground mb-1">
            {certificate.courseTitle}
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            Issued by {certificate.issuerName}
          </p>

          {/* Divider */}
          <div className="w-16 h-px bg-warning/30 mx-auto mb-6" />

          <p className="text-sm text-muted-foreground mb-1">Awarded to</p>
          <p className="text-2xl font-semibold text-foreground mb-6">
            {certificate.studentName}
          </p>

          {/* Date */}
          <p className="text-sm text-muted-foreground">{formattedDate}</p>

          {/* QR Code placeholder */}
          <div className="mt-6 inline-flex flex-col items-center">
            <div className="w-20 h-20 bg-muted border border-border rounded-md flex items-center justify-center">
              <svg className="w-10 h-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground mt-1">QR Code</p>
          </div>

          {/* Verification code */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground">Verification Code</p>
            <p className="text-sm font-mono font-medium text-foreground tracking-wider">
              {certificate.verificationCode}
            </p>
          </div>
        </div>

        {/* Decorative bottom border */}
        <div className="h-2 bg-gradient-to-r from-warning via-warning/60 to-warning" />
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex items-center gap-3">
        {/* Download button */}
        <Button
          onClick={handleDownload}
          disabled={!certificate.pdfUrl}
          className="flex-1 gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download PDF
        </Button>

        {/* Share button with dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShareMenuOpen((prev) => !prev)}
            className="gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
            Share
          </Button>

          {shareMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg py-1 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShare('copy')}
                className="w-full justify-start rounded-none px-4 gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.539a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L5.25 9.503" />
                </svg>
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShare('twitter')}
                className="w-full justify-start rounded-none px-4 gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on X
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShare('linkedin')}
                className="w-full justify-start rounded-none px-4 gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                </svg>
                Share on LinkedIn
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

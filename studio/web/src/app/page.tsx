import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-xl">Starter Studio</div>
          <nav className="flex items-center gap-4">
            <Link href="/showcase" className="text-muted-foreground hover:text-foreground">
              Showcase
            </Link>
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/templates" className="text-muted-foreground hover:text-foreground">
              Templates
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Build Your SaaS in Days, Not Months
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Configure your app by selecting the features you need, preview it live,
            and download production-ready code.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/pricing"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
            >
              Start Configuring
            </Link>
            <Link
              href="/showcase"
              className="px-6 py-3 border rounded-md font-medium hover:bg-accent"
            >
              Browse Components
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Modular Features</h3>
            <p className="text-muted-foreground">
              Pick only the features you need. Pay for what you use, not for bloat.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Live Preview</h3>
            <p className="text-muted-foreground">
              See your app working before you buy. Try all features in action.
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Download & Own</h3>
            <p className="text-muted-foreground">
              Get production-ready code. No vendor lock-in. Own it forever.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

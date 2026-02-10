import Link from "next/link";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button, Container } from "@/components/ui";

export default function PublicNotFound() {
  return (
    <Container className="py-20">
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        {/* 404 Icon */}
        <div className="w-20 h-20 mb-6 rounded-full bg-muted flex items-center justify-center">
          <FileQuestion className="w-10 h-10 text-muted-foreground" />
        </div>

        {/* 404 Message */}
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-8">
          The page you are looking for does not exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild variant="default">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go home
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/showcase">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse components
            </Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}

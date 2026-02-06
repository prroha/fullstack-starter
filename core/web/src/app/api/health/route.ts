import { NextResponse } from "next/server";

/**
 * Health check endpoint for Docker and load balancers
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

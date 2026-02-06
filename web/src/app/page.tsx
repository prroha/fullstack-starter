"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function Home() {
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Starter Template</h1>

      {isAuthenticated ? (
        <div>
          <p className="mb-4">Hello, {user?.name || user?.email}!</p>
          <button
            onClick={() => logout()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="space-x-4">
          <Link
            href="/login"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 inline-block"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 inline-block"
          >
            Register
          </Link>
        </div>
      )}
    </div>
  );
}

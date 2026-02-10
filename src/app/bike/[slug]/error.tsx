"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Bike page error:", error);
  }, [error]);

  const isBikeNotFound = error.message?.includes("not found");

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#e6e6e6]">
      <div className="text-center max-w-md px-4">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-black mb-2">
          {isBikeNotFound ? "Bike Not Found" : "Something went wrong"}
        </h1>
        <p className="text-black/60 mb-6">
          {isBikeNotFound
            ? "The bike you're looking for doesn't exist. Please check the URL and try again."
            : "We encountered an error loading this bike. Please try again."}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full px-4 py-2 rounded-lg border border-black/20 text-black/70 hover:border-black/40 hover:bg-black/5 text-sm uppercase tracking-[0.2em] transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/bike/ktm-500-exc-f"
            className="block w-full px-4 py-2 rounded-lg bg-black text-white hover:bg-black/80 text-sm uppercase tracking-[0.2em] transition-colors"
          >
            Go to Default Bike
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-black/50">
              Error Details
            </summary>
            <pre className="mt-2 bg-black/5 p-2 rounded text-xs overflow-auto text-black/70">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

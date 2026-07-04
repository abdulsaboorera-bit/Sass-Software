"use client";

import { useRouter } from "next/navigation";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <button onClick={() => router.push("/")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Go Home
        </button>
      </div>
    </div>
  );
}

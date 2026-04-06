"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/my-listings");
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-green-600 mb-3">
          ✅ Payment Successful
        </h1>

        <p className="text-gray-600 mb-4">
          Your listing is being updated. This will take a few seconds.
        </p>

        <div className="animate-pulse text-sm text-gray-400">
          Redirecting...
        </div>
      </div>
    </main>
  );
}
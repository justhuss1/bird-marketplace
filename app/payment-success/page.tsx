"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const router = useRouter();

  const type = params.get("type");
  const listingId = params.get("listingId");

  useEffect(() => {
    if (!type || !listingId) return;

    const updateListing = async () => {
      if (type === "feature") {
        await supabase
          .from("listings")
          .update({ is_featured: true })
          .eq("id", listingId);
      }

      if (type === "boost") {
        const boostExpiry = new Date();
        boostExpiry.setDate(boostExpiry.getDate() + 7);

        await supabase
          .from("listings")
          .update({ boost_until: boostExpiry.toISOString() })
          .eq("id", listingId);
      }

      router.push("/my-listings");
    };

    updateListing();
  }, [type, listingId, router]);

  return (
    <main className="p-6 text-center">
      <h1 className="text-xl font-bold">Processing payment...</h1>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6 text-center">
          <h1 className="text-xl font-bold">Loading payment details...</h1>
        </main>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
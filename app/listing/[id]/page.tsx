"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string | null;
  description: string;
  user_id: string;
};

export default function ListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("ERROR:", error);
      return;
    }

    setListing(data);
  };

  const handleMessageSeller = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in to message the seller.");
      router.push("/login");
      return;
    }

    if (!listing) return;

    if (user.id === listing.user_id) {
      alert("This is your own listing.");
      return;
    }

    const { data: existingConversation, error: existingError } = await supabase
      .from("conversations")
      .select("*")
      .eq("listing_id", listing.id)
      .eq("buyer_id", user.id)
      .eq("seller_id", listing.user_id)
      .maybeSingle();

    if (existingError) {
      console.error(existingError);
      alert("Could not open conversation");
      return;
    }

    if (existingConversation) {
      router.push(`/messages/${existingConversation.id}`);
      return;
    }

    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert([
        {
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.user_id,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error(createError);
      alert("Could not create conversation");
      return;
    }

    router.push(`/messages/${newConversation.id}`);
  };

  if (!listing) {
    return <main className="p-4">Loading...</main>;
  }

  return (
    <main className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">
          {/* IMAGE CARD */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <img
              src={
                listing.image && listing.image !== ""
                  ? listing.image
                  : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1200"
              }
              alt={listing.title}
              className="w-full h-[420px] object-cover"
            />
          </div>

          {/* DETAILS CARD */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {listing.title}
                </h1>
                <p className="text-gray-500 mt-2">📍 {listing.location}</p>
              </div>

              <div className="text-3xl font-bold text-green-600">
                ${listing.price}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
                Bird Listing
              </span>
              <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                Available Now
              </span>
            </div>

            <div className="mt-6 border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">Description</h2>
              <p className="text-gray-700 leading-7">
                {listing.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          {/* CONTACT CARD */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Seller</h2>

            <button
              onClick={handleMessageSeller}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Message Seller
            </button>

            <p className="text-sm text-gray-500 mt-3">
              Ask about availability, pickup, and more.
            </p>
          </div>

          {/* SELLER CARD */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Seller Info</h2>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-lg font-bold text-green-700">
                S
              </div>
              <div>
                <p className="font-medium text-gray-800">Seller</p>
                <p className="text-sm text-gray-500">Verified account</p>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 space-y-2">
              <p>✅ Safe in-app messaging</p>
              <p>✅ Listing protected by account login</p>
              <p>✅ Secure marketplace experience</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
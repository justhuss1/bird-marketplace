"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type SavedListingRow = {
  id: string;
  listing_id: string;
  listings: {
    id: string;
    title: string;
    price: string;
    location: string;
    image: string | null;
    description: string;
  } | null;
};

export default function SavedListingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savedListings, setSavedListings] = useState<SavedListingRow[]>([]);

  useEffect(() => {
    fetchSavedListings();
  }, []);

  const fetchSavedListings = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("saved_listings")
      .select(
        `
        id,
        listing_id,
        listings (
          id,
          title,
          price,
          location,
          image,
          description
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setSavedListings((data ?? []) as unknown as SavedListingRow[]);
    }

    setLoading(false);
  };

  const handleRemoveSaved = async (listingId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("saved_listings")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    if (error) {
      console.error(error);
      alert("Failed to remove saved listing");
      return;
    }

    setSavedListings((prev) =>
      prev.filter((item) => item.listing_id !== listingId)
    );
  };

  if (loading) {
    return <main className="p-4">Loading saved listings...</main>;
  }

  return (
    <main className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-black transition"
        >
          ← Back
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Saved Listings</h1>
          <p className="text-gray-500 mt-1">
            Listings you’ve saved for later.
          </p>
        </div>

        {savedListings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="text-4xl mb-3">❤️</div>
            <h2 className="text-xl font-semibold text-gray-800">
              No saved listings yet
            </h2>
            <p className="text-gray-500 mt-2">
              Save listings you like so you can come back to them later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {savedListings.map((item) => {
              const listing = item.listings;
              if (!listing) return null;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden"
                >
                  <Link href={`/listing/${listing.id}`}>
                    <div className="cursor-pointer">
                      <img
                        src={
                          listing.image && listing.image !== ""
                            ? listing.image
                            : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1200"
                        }
                        alt={listing.title}
                        className="h-56 w-full object-cover"
                      />
                    </div>
                  </Link>

                  <div className="p-4">
                    <Link href={`/listing/${listing.id}`}>
                      <h2 className="text-lg font-semibold text-gray-900 hover:text-green-600 transition cursor-pointer">
                        {listing.title}
                      </h2>
                    </Link>

                    <p className="text-green-600 font-bold text-2xl mt-2">
                      ${listing.price}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      📍 {listing.location}
                    </p>

                    <p className="text-sm text-gray-600 mt-3">
                      {listing.description || "No description provided."}
                    </p>

                    <button
                      onClick={() => handleRemoveSaved(listing.id)}
                      className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                      Remove Saved
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
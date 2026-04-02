"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string | null;
  created_at: string;
};

type Listing = {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string | null;
  images?: string[] | null;
  description: string;
  user_id: string;
};

export default function SellerPage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params?.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sellerId) {
      fetchSellerPage();
    }
  }, [sellerId]);

  const fetchSellerPage = async () => {
    setLoading(true);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sellerId)
      .single();

    if (profileError) {
      console.error(profileError);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    const { data: listingData, error: listingError } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", sellerId)
      .order("created_at", { ascending: false });

    if (listingError) {
      console.error(listingError);
      setLoading(false);
      return;
    }

    setListings(listingData || []);
    setLoading(false);
  };

  if (loading) {
    return <main className="p-4">Loading seller profile...</main>;
  }

  if (!profile) {
    return (
      <main className="p-4">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-black transition"
        >
          ← Back
        </button>
        <p>Seller not found.</p>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen py-8 px-4 pb-24">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-black transition"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
              {profile.username?.charAt(0).toUpperCase() || "U"}
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.username || "User"}
              </h1>
              <p className="text-gray-500">
                Member since{" "}
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : "recently"}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {listings.length} active listing{listings.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Listings by {profile.username || "this seller"}
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <p className="text-gray-500">This seller has no listings right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listing/${listing.id}`}>
                <div className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer">
                  <img
                    src={
                      listing.image && listing.image !== ""
                        ? listing.image
                        : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600"
                    }
                    alt={listing.title}
                    className="w-full h-52 object-cover"
                  />

                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {listing.title}
                    </h3>
                    <p className="text-green-600 font-bold text-lg mt-1">
                      ${listing.price}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      📍 {listing.location}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Bird, MapPin, ShieldCheck } from "lucide-react";

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
  description: string;
  user_id: string;
  is_featured?: boolean | null;
  boost_until?: string | null;
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
      <main className="bg-gray-50 min-h-screen py-8 px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-4 text-sm text-gray-600 hover:text-black transition"
          >
            ← Back
          </button>
          <p>Seller not found.</p>
        </div>
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

        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-2xl font-bold text-green-700 shadow-sm">
              {profile.username?.charAt(0).toUpperCase() || "U"}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {profile.username || "User"}
              </h1>
              <p className="text-gray-500 mt-1">
                Member since{" "}
                {profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : "recently"}
              </p>
              <p className="text-sm text-gray-600 mt-2 inline-flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-600" />
                {listings.length} active listing
                {listings.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <Bird size={18} className="text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Listings by {profile.username || "this seller"}
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-10 text-center border border-gray-100">
            <p className="text-gray-500">This seller has no listings right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <Link key={listing.id} href={`/listing/${listing.id}`}>
                <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden">
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        listing.image && listing.image !== ""
                          ? listing.image
                          : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600"
                      }
                      alt={listing.title}
                      className="w-full h-52 object-cover group-hover:scale-105 transition duration-500"
                    />

                    {listing.is_featured && (
                      <span className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                        ★ Featured
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-medium text-[15px] text-gray-900 line-clamp-1">
                      {listing.title}
                    </h3>

                    <p className="text-green-600 font-semibold text-lg mt-1">
                      ${listing.price}
                    </p>

                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin size={14} />
                      {listing.location}
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
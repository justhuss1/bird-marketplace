"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Bird,
  MapPin,
  ShieldCheck,
  User,
  CalendarDays,
  Tag,
  Star,
} from "lucide-react";

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
  category?: string | null;
  description: string;
  user_id: string;
  is_featured?: boolean | null;
  boost_until?: string | null;
  created_at?: string;
};

export default function SellerPage() {
  const params = useParams();
  const router = useRouter();
  const sellerId = params?.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingAvg, setRatingAvg] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);

  useEffect(() => {
    if (sellerId) {
      fetchSellerPage();
    }
  }, [sellerId]);

  const fetchRatingsSummary = async (userId: string) => {
    const { data, error } = await supabase
      .from("ratings")
      .select("rating")
      .eq("reviewed_user_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    const rows = data || [];
    const count = rows.length;

    if (count === 0) {
      setRatingAvg(null);
      setRatingCount(0);
      return;
    }

  const total = rows.reduce((sum, row) => sum + row.rating, 0);
  setRatingAvg(total / count);
  setRatingCount(count);
};

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
    await fetchRatingsSummary(sellerId);

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

    setListings((listingData || []) as Listing[]);
    setLoading(false);
  };

  const formatJoinedDate = (date?: string) => {
    if (!date) return "recently";
    return new Date(date).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  };

  const formatPostedDate = (date?: string) => {
    if (!date) return "Recently listed";

    const posted = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - posted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Listed today";
    if (diffDays === 1) return "Listed yesterday";
    if (diffDays < 7) return `Listed ${diffDays} days ago`;

    return `Listed ${posted.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`;
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
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Seller not found
            </h1>
            <p className="mt-2 text-gray-500">
              This seller profile may no longer be available.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen py-6 sm:py-8 px-4 pb-24">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* HERO CARD */}
        <section className="mt-5 bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#07111f] via-[#102038] to-[#1b2e4a] px-6 sm:px-8 py-8 sm:py-10 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-white/10 border border-white/15 backdrop-blur flex items-center justify-center text-3xl font-bold text-white shadow-sm">
                {profile.username?.charAt(0).toUpperCase() || "U"}
              </div>

              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 mb-3">
                  <ShieldCheck size={14} />
                  Verified seller account
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                  {profile.username || "User"}
                </h1>

                <p className="mt-2 text-white/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={15} />
                    Member since {formatJoinedDate(profile.created_at)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Bird size={15} />
                    {listings.length} active listing
                    {listings.length === 1 ? "" : "s"}
                  </span>
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold text-gray-900">
                    {ratingAvg ? ratingAvg.toFixed(1) : "New"}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({ratingCount} review{ratingCount === 1 ? "" : "s"})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Trusted Seller
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-5">
                    Authenticated account for safer marketplace interactions.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                  <Bird size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Active Listings
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-5">
                    {listings.length} listing{listings.length === 1 ? "" : "s"} currently
                    available to browse.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Marketplace Profile
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-5">
                    Browse this seller’s pets and connect directly through in-app
                    messaging.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LISTINGS HEADER */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Seller Listings
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                Pets from {profile.username || "this seller"}
              </h2>
              <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                Explore active listings from this seller across the marketplace.
              </p>
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <Bird size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                No listings right now
              </h3>
              <p className="text-gray-500 mt-2">
                This seller does not have any active listings at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Link key={listing.id} href={`/listing/${listing.id}`}>
                  <article className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden">
                    <div className="relative overflow-hidden">
                      <img
                        src={
                          listing.image && listing.image !== ""
                            ? listing.image
                            : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=900"
                        }
                        alt={listing.title}
                        className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
                      />

                      {listing.is_featured && (
                        <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                          ★ Featured
                        </span>
                      )}

                      {listing.boost_until &&
                        new Date(listing.boost_until) > new Date() && (
                          <span className="absolute top-3 right-3 bg-purple-600 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                            Boosted
                          </span>
                        )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-[17px] text-gray-900 line-clamp-1 leading-snug">
                          {listing.title}
                        </h3>

                        <span className="text-green-600 font-semibold text-[18px] whitespace-nowrap">
                          ${listing.price}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                        <MapPin size={14} />
                        {listing.location}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full items-center gap-1.5">
                          <Tag size={12} />
                          {listing.category || "Pet Listing"}
                        </span>

                        <span className="text-xs text-gray-400">
                          {formatPostedDate(listing.created_at)}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
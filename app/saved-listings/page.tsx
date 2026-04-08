"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Heart,
  MapPin,
  PawPrint,
  Trash2,
  ShieldCheck,
  Tag,
} from "lucide-react";

type SavedListing = {
  id: string;
  listing_id: string;
  listings?: {
    id: string;
    title: string;
    price: string;
    location: string;
    image: string | null;
    category?: string | null;
    is_featured?: boolean | null;
    boost_until?: string | null;
    created_at?: string;
  } | null;
};

export default function SavedListingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);

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
          category,
          is_featured,
          boost_until,
          created_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const formatted: SavedListing[] = (data || []).map((item: any) => ({
      id: item.id,
      listing_id: item.listing_id,
      listings: item.listings ?? null,
    }));

    setSavedListings(formatted);
    setLoading(false);
  };

  const handleRemoveSaved = async (savedId: string) => {
    const { error } = await supabase
      .from("saved_listings")
      .delete()
      .eq("id", savedId);

    if (error) {
      console.error(error);
      alert("Failed to remove saved listing");
      return;
    }

    setSavedListings((prev) => prev.filter((item) => item.id !== savedId));
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
    return <main className="p-4">Loading saved listings...</main>;
  }

  const validSavedListings = savedListings.filter((item) => item.listings);

  const featuredSavedCount = validSavedListings.filter(
    (item) => item.listings?.is_featured
  ).length;

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

        {/* HERO */}
        <section className="mt-5 bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#07111f] via-[#102038] to-[#1b2e4a] px-6 sm:px-8 py-8 sm:py-10 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 mb-3">
                  <ShieldCheck size={14} />
                  Buyer wishlist
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                  Saved Listings
                </h1>

                <p className="mt-3 text-white/80 max-w-2xl text-sm sm:text-base leading-7">
                  Keep track of pets and pet-related listings you’re interested
                  in, compare options, and come back when you’re ready to message
                  a seller.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/">
                  <button className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md inline-flex items-center gap-2">
                    <PawPrint size={16} />
                    Browse More Pets
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="bg-red-50 text-red-500 p-2.5 rounded-xl shrink-0">
                  <Heart size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Saved Items
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-5">
                    {validSavedListings.length} listing
                    {validSavedListings.length === 1 ? "" : "s"} saved to your
                    wishlist.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-50 text-yellow-600 p-2.5 rounded-xl shrink-0">
                  <Heart size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Featured Saved
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-5">
                    {featuredSavedCount} featured listing
                    {featuredSavedCount === 1 ? "" : "s"} saved for later.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                  <PawPrint size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Ready to Compare
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-5">
                    Review saved pets before contacting sellers directly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SAVED LISTINGS */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Wishlist
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                Your saved pets
              </h2>
              <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                Revisit saved listings, compare details, and message sellers
                when you’re ready.
              </p>
            </div>
          </div>

          {validSavedListings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <Heart size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                No saved listings yet
              </h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Save pets and pet-related listings you like so you can compare
                them later and message sellers when the time is right.
              </p>

              <Link href="/">
                <button className="mt-6 rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md inline-flex items-center gap-2">
                  <PawPrint size={16} />
                  Browse listings
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {validSavedListings.map((savedItem) => {
                const listing = savedItem.listings!;
                const isBoosted =
                  !!listing.boost_until &&
                  new Date(listing.boost_until) > new Date();

                return (
                  <article
                    key={savedItem.id}
                    className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden"
                  >
                    <Link href={`/listing/${listing.id}`}>
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

                        {isBoosted && (
                          <span className="absolute top-3 right-3 bg-purple-600 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                            Boosted
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <Link href={`/listing/${listing.id}`}>
                          <h3 className="font-semibold text-[17px] text-gray-900 line-clamp-1 leading-snug hover:text-green-600 transition">
                            {listing.title}
                          </h3>
                        </Link>

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

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <Link href={`/listing/${listing.id}`}>
                          <button className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white px-4 py-3 text-sm font-semibold transition shadow-sm inline-flex items-center justify-center gap-2">
                            <PawPrint size={16} />
                            View
                          </button>
                        </Link>

                        <button
                          onClick={() => handleRemoveSaved(savedItem.id)}
                          className="w-full rounded-2xl bg-red-500 hover:bg-red-600 text-white px-4 py-3 text-sm font-semibold transition shadow-sm inline-flex items-center justify-center gap-2"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
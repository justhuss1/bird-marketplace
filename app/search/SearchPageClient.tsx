"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Heart, MapPin, Search, SlidersHorizontal } from "lucide-react";

type Listing = {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string | null;
  category?: string | null;
  is_featured?: boolean | null;
  boost_until?: string | null;
  attributes?: Record<string, string> | null;
  created_at?: string;
};

export default function SearchPageClient() {
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const location = searchParams.get("location") || "";
  const category = searchParams.get("category") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const sortBy = searchParams.get("sortBy") || "newest";

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);

  useEffect(() => {
    fetchListings();
    fetchSavedListings();
  }, [q, location, category, minPrice, maxPrice, sortBy]);

  const fetchListings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setListings((data || []) as Listing[]);
    setLoading(false);
  };

  const fetchSavedListings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSavedListingIds([]);
      return;
    }

    const { data, error } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    setSavedListingIds((data || []).map((item) => item.listing_id));
  };

  const handleToggleSave = async (
    e: React.MouseEvent,
    listingId: string
  ) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in to save listings.");
      return;
    }

    const isSaved = savedListingIds.includes(listingId);

    if (isSaved) {
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

      setSavedListingIds((prev) => prev.filter((id) => id !== listingId));
    } else {
      const { error } = await supabase.from("saved_listings").insert([
        {
          user_id: user.id,
          listing_id: listingId,
        },
      ]);

      if (error) {
        console.error(error);
        alert("Failed to save listing");
        return;
      }

      setSavedListingIds((prev) => [...prev, listingId]);
    }
  };

  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        const query = q.toLowerCase();

        const matchesSearch =
          !q ||
          item.title.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          Object.values(item.attributes || {}).some((value) =>
            value.toLowerCase().includes(query)
          );

        const matchesLocation =
          !location ||
          item.location?.toLowerCase().includes(location.toLowerCase());

        const matchesCategory = !category || item.category === category;

        const numericPrice = Number(item.price || 0);
        const matchesMinPrice = !minPrice || numericPrice >= Number(minPrice);
        const matchesMaxPrice = !maxPrice || numericPrice <= Number(maxPrice);

        return (
          matchesSearch &&
          matchesLocation &&
          matchesCategory &&
          matchesMinPrice &&
          matchesMaxPrice
        );
      })
      .sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;

        if (sortBy === "lowest") {
          return Number(a.price || 0) - Number(b.price || 0);
        }

        if (sortBy === "highest") {
          return Number(b.price || 0) - Number(a.price || 0);
        }

        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      });
  }, [listings, q, location, category, minPrice, maxPrice, sortBy]);

  return (
    <main className="bg-gray-50 min-h-screen px-4 py-6 pb-24">
      <div className="max-w-7xl mx-auto">
        <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-medium">
                <Search size={14} />
                Search Results
              </div>

              <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                {q ? `Results for “${q}”` : "Browse Listings"}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                {filteredListings.length} matching listing
                {filteredListings.length === 1 ? "" : "s"}
              </p>
            </div>

            <Link href="/">
              <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition">
                Back to Home
              </button>
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {q && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Search: {q}
              </span>
            )}
            {location && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Location: {location}
              </span>
            )}
            {category && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Category: {category}
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Price: {minPrice || "0"} - {maxPrice || "Any"}
              </span>
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-2 mb-5">
            <SlidersHorizontal size={18} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Matching Listings
            </h2>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              Loading results...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              <h3 className="text-xl font-semibold text-gray-900">
                No listings found
              </h3>
              <p className="text-gray-500 mt-2">
                Try a different keyword, category, or location.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredListings.map((item) => (
                <Link key={item.id} href={`/listing/${item.id}`}>
                  <article className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden">
                    <div className="relative overflow-hidden">
                      <img
                        src={
                          item.image && item.image !== ""
                            ? item.image
                            : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=900"
                        }
                        alt={item.title}
                        className="h-56 w-full object-cover group-hover:scale-105 transition duration-500"
                      />

                      {item.is_featured ? (
                        <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                          ★ Featured
                        </span>
                      ) : (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-gray-800 text-xs px-3 py-1 rounded-full shadow font-medium">
                          New
                        </span>
                      )}

                      <button
                        onClick={(e) => handleToggleSave(e, item.id)}
                        className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-medium shadow backdrop-blur transition ${
                          savedListingIds.includes(item.id)
                            ? "bg-red-500 text-white"
                            : "bg-white/90 text-gray-800"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Heart size={14} />
                          {savedListingIds.includes(item.id) ? "Saved" : "Save"}
                        </span>
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-[17px] text-gray-900 line-clamp-1 leading-snug">
                          {item.title}
                        </h3>

                        <span className="text-green-600 font-semibold text-[18px] whitespace-nowrap">
                          ${item.price}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                        <MapPin size={14} />
                        {item.location}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                          {item.category || "Pet Listing"}
                        </span>

                        <span className="text-xs text-gray-400">
                          View details
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
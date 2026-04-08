"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Bird,
  Heart,
  MapPin,
  ShieldCheck,
  MessageCircle,
  Star,
  Search,
} from "lucide-react";

type Listing = {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string | null;
  category?: string | null;
  is_featured?: boolean | null;
  boost_until?: string | null;
};

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchListings();
    getCurrentUser();
    fetchSavedListings();
  }, []);

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setListings(data || []);
  };

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserEmail(user?.email || "");
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail("");
    setSavedListingIds([]);
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

  const clearFilters = () => {
    setCategoryFilter("");
    setMinPrice("");
    setMaxPrice("");
    setSearchTerm("");
    setLocationFilter("");
    setSortBy("newest");
  };

  const hasActiveFilters =
    !!categoryFilter ||
    !!minPrice ||
    !!maxPrice ||
    !!searchTerm ||
    !!locationFilter ||
    sortBy !== "newest";

  const filteredListings = listings
    .filter((item) => {
      const matchesSearch = item.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesLocation = item.location
        ?.toLowerCase()
        .includes(locationFilter.toLowerCase());

      const matchesCategory = categoryFilter
        ? item.category === categoryFilter
        : true;

      const numericPrice = Number(item.price || 0);

      const matchesMinPrice = minPrice
        ? numericPrice >= Number(minPrice)
        : true;

      const matchesMaxPrice = maxPrice
        ? numericPrice <= Number(maxPrice)
        : true;

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

      const now = new Date();

      const aBoost = a.boost_until
        ? new Date(a.boost_until).getTime() > now.getTime()
        : false;

      const bBoost = b.boost_until
        ? new Date(b.boost_until).getTime() > now.getTime()
        : false;

      if (aBoost && !bBoost) return -1;
      if (!aBoost && bBoost) return 1;

      if (sortBy === "lowest") {
        return Number(a.price || 0) - Number(b.price || 0);
      }

      if (sortBy === "highest") {
        return Number(b.price || 0) - Number(a.price || 0);
      }

      return 0;
    });

  const featuredListings = filteredListings.filter((item) => item.is_featured);
  const mainListings = filteredListings.filter((item) => !item.is_featured);

  const categoryItems = [
    { name: "Parrots", icon: Bird },
    { name: "Cockatiels", icon: Bird },
    { name: "Finches", icon: Bird },
    { name: "Canaries", icon: Bird },
    { name: "Supplies", icon: Star },
  ];

  return (
    <main className="bg-gray-50 min-h-screen pb-24 md:pb-20">
      {/* TOP NAV */}
      <div className="bg-white/90 backdrop-blur border-b border-gray-100 px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <div className="max-w-6xl w-full mx-auto flex justify-between items-center">
          <h1 className="text-[15px] sm:text-lg font-bold text-green-600 flex items-center gap-2">
            <Bird size={18} />
            Bird Marketplace
          </h1>

          <div className="flex gap-2 items-center">
            {userEmail ? (
              <>
                <span className="text-sm text-gray-600 hidden md:block">
                  {userEmail}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-3 py-2 rounded-xl text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link href="/login">
                <button className="bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-medium">
                  Login
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#07111f]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=1800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07111f]/95 via-[#07111f]/80 to-[#07111f]/30" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10" />

        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24">
          <div className="max-w-3xl lg:max-w-[44rem]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
              <ShieldCheck size={14} />
              Trusted bird marketplace across Australia
            </div>

            <h1 className="mt-5 text-[44px] leading-[0.95] font-bold tracking-tight text-white sm:text-5xl lg:text-[4.5rem] lg:leading-[0.95]">
              <span className="block">Buy, Sell & Rehome</span>
              <span className="block">Birds Safely</span>
            </h1>

            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-white/85 sm:text-lg">
              Australia’s dedicated marketplace for bird lovers — discover
              healthy birds, connect with verified sellers, and rehome with
              confidence.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={() => {
                  const listingsSection =
                    document.getElementById("latest-listings");
                  listingsSection?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3.5 text-sm font-semibold transition shadow-md"
              >
                Browse Listings
              </button>

              <Link href="/create" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 text-white px-5 py-3.5 text-sm font-semibold transition">
                  Post a Listing
                </button>
              </Link>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/95 p-4 sm:p-5 shadow-2xl backdrop-blur max-w-4xl">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_0.95fr_auto]">
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <Search size={18} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by bird type, breed or keyword"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <MapPin size={18} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter suburb, city or state"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>

                <button
                  onClick={() => {
                    const listingsSection =
                      document.getElementById("latest-listings");
                    listingsSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-2xl bg-green-600 hover:bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0c1a2d]"
                >
                  Search
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600 sm:text-sm">
                <span className="font-medium text-gray-700">
                  Trusted by bird owners across Australia
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-green-600" />
                  Verified users
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-green-600" />
                  Secure messaging
                </span>

                <span className="inline-flex items-center gap-1.5">
                  <Bird size={14} className="text-green-600" />
                  Bird-focused marketplace
                </span>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-600 hover:text-black underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-6xl mx-auto px-4 -mt-10 mb-8 relative z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categoryItems.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setCategoryFilter(cat.name)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap border transition ${
                categoryFilter === cat.name
                  ? "bg-green-600 text-white border-green-600 shadow-md"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <cat.icon size={16} />
              <span className="text-sm font-medium">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="max-w-6xl mx-auto px-4 -mt-4 sm:-mt-2 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-start gap-3">
              <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Verified Sellers
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-5">
                  All users are authenticated for safety
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-start gap-3">
              <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                <MessageCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Secure Messaging
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-5">
                  Chat safely within the platform
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-start gap-3">
              <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                <Bird size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Bird-Focused Marketplace
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-5">
                  Built specifically for bird lovers
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-start gap-3">
              <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                <Star size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Simple Rehoming
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-5">
                  Easy process to buy, sell, or rehome
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED LISTINGS */}
      {featuredListings.length > 0 && (
        <section
          id="featured-listings"
          className="max-w-6xl mx-auto px-4 mt-12 mb-12 animate-fade-in-up"
        >
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Featured
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                Featured Birds
              </h2>
              <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                Promoted listings from trusted sellers and standout breeders
                across Australia.
              </p>
            </div>

            <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition self-start sm:self-auto">
              View all featured →
            </button>
          </div>

          <p className="text-xs text-gray-400 mb-3">Swipe to explore →</p>

          <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {featuredListings.map((item) => (
              <Link
                key={item.id}
                href={`/listing/${item.id}`}
                className="snap-start min-w-[280px] sm:min-w-[340px] max-w-[340px]"
              >
                <article className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden">
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        item.image && item.image !== ""
                          ? item.image
                          : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=900"
                      }
                      alt={item.title}
                      className="h-52 sm:h-56 w-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                    <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                      ★ Featured
                    </span>

                    {item.boost_until &&
                      new Date(item.boost_until) > new Date() && (
                        <span className="absolute top-3 left-28 bg-purple-600 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                          Boosted
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
                      <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                        {item.title}
                      </h3>

                      <span className="text-green-600 font-semibold text-lg whitespace-nowrap">
                        ${item.price}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={14} />
                      {item.location}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                        {item.category || "Bird Listing"}
                      </span>

                      <span className="hidden sm:inline text-xs text-gray-400 uppercase tracking-wide">
                        Promoted
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* MAIN LISTINGS */}
      <section
        id="latest-listings"
        className="max-w-6xl mx-auto px-4 mt-12 mb-16 animate-fade-in-up"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
              Latest Listings
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
              Fresh Birds Near You
            </h2>
            <p className="mt-2 text-sm text-gray-500 max-w-2xl">
              Newly listed birds from sellers across Australia, updated in real
              time.
            </p>
          </div>

          <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition self-start sm:self-auto">
            View all listings →
          </button>
        </div>

        {mainListings.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              No listings found
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Try adjusting your filters or searching a different location.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {mainListings.map((item) => (
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
                      className="h-52 sm:h-56 w-full object-cover group-hover:scale-105 transition duration-500"
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

                    {item.boost_until &&
                      new Date(item.boost_until) > new Date() && (
                        <span className="absolute top-3 left-28 bg-purple-600 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                          Boosted
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
                        {item.category || "Bird Listing"}
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

      {/* SELLER / BUYER CTA SECTION */}
      <section className="max-w-6xl mx-auto px-4 mb-16 animate-fade-in-up">
        <div className="rounded-[32px] overflow-hidden bg-[#07111f] text-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 sm:p-10 lg:p-12 border-b lg:border-b-0 lg:border-r border-white/10">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-400">
                For Sellers
              </p>

              <h3 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight">
                Ready to find a new home for your bird?
              </h3>

              <p className="mt-4 text-sm sm:text-base text-white/75 max-w-md leading-7">
                Create a listing, upload great photos, and connect with serious
                buyers across Australia in just a few steps.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/create">
                  <button className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md">
                    Post Your Listing
                  </button>
                </Link>

                <Link href="/my-listings">
                  <button className="rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 text-white px-5 py-3 text-sm font-semibold transition">
                    Manage Listings
                  </button>
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/60">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 border border-white/10">
                  <ShieldCheck size={14} className="text-green-400" />
                  Verified accounts
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 border border-white/10">
                  <MessageCircle size={14} className="text-green-400" />
                  Secure messaging
                </span>
              </div>
            </div>

            <div className="p-8 sm:p-10 lg:p-12">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-400">
                For Buyers
              </p>

              <h3 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight">
                Looking for the right bird?
              </h3>

              <p className="mt-4 text-sm sm:text-base text-white/75 max-w-md leading-7">
                Explore featured and newly listed birds from trusted sellers,
                compare options, and message directly within the platform.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    const listingsSection =
                      document.getElementById("latest-listings");
                    listingsSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-2xl bg-white text-[#07111f] hover:bg-gray-100 px-5 py-3 text-sm font-semibold transition shadow-md"
                >
                  Browse Birds
                </button>

                <Link href="/saved-listings">
                  <button className="rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 text-white px-5 py-3 text-sm font-semibold transition">
                    View Saved
                  </button>
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/60">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 border border-white/10">
                  <Bird size={14} className="text-green-400" />
                  Bird-focused marketplace
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 border border-white/10">
                  <Star size={14} className="text-green-400" />
                  Featured listings available
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PREMIUM FOOTER */}
      <footer className="bg-white border-t border-gray-100 mt-6">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 text-green-600 font-semibold text-lg">
                <Bird size={20} />
                <span>Bird Marketplace</span>
              </div>

              <p className="mt-4 text-sm text-gray-500 leading-7 max-w-sm">
                A safer, simpler way to buy, sell, and rehome birds across
                Australia. Built for bird lovers, trusted by verified users.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-[0.14em]">
                Browse
              </h4>

              <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500">
                <button
                  onClick={() => {
                    const listingsSection =
                      document.getElementById("latest-listings");
                    listingsSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-left hover:text-gray-900 transition"
                >
                  Latest Listings
                </button>

                <button
                  onClick={() => {
                    const featuredSection =
                      document.getElementById("featured-listings");
                    featuredSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-left hover:text-gray-900 transition"
                >
                  Featured Birds
                </button>

                <button
                  onClick={() => setCategoryFilter("Parrots")}
                  className="text-left hover:text-gray-900 transition"
                >
                  Parrots
                </button>

                <button
                  onClick={() => setCategoryFilter("Cockatiels")}
                  className="text-left hover:text-gray-900 transition"
                >
                  Cockatiels
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-[0.14em]">
                Sell
              </h4>

              <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500">
                <Link href="/create" className="hover:text-gray-900 transition">
                  Post a Listing
                </Link>

                <Link
                  href="/my-listings"
                  className="hover:text-gray-900 transition"
                >
                  Manage Listings
                </Link>

                <Link
                  href="/messages"
                  className="hover:text-gray-900 transition"
                >
                  Messages
                </Link>

                <Link
                  href="/notifications"
                  className="hover:text-gray-900 transition"
                >
                  Notifications
                </Link>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-[0.14em]">
                Account
              </h4>

              <div className="mt-4 flex flex-col gap-3 text-sm text-gray-500">
                <Link
                  href="/saved-listings"
                  className="hover:text-gray-900 transition"
                >
                  Saved Listings
                </Link>

                <Link href="/login" className="hover:text-gray-900 transition">
                  Login
                </Link>

                <button
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  className="text-left hover:text-gray-900 transition"
                >
                  Back to top
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Bird Marketplace. All rights
              reserved.
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={14} />
                Verified users
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle size={14} />
                Secure messaging
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
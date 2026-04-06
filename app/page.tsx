"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

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

    if (!error) {
      setListings(data || []);
    } else {
      console.error(error);
    }
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

  return (
    <main className="bg-gray-50 min-h-screen pb-24 md:pb-20">
      {/* TOP NAV */}
      <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center">
        <h1 className="text-base sm:text-lg font-bold text-green-600">
          🐦 Bird Marketplace
        </h1>

        <div className="flex gap-2 items-center">
          {userEmail ? (
            <>
              <span className="text-sm text-gray-600 hidden md:block">
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login">
              <button className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* HERO */}
      <div className="relative text-white px-4 py-8 sm:py-14 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/20" />

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-2 leading-tight">
            Buy, Sell & Rehome Birds
          </h2>
          <p className="text-base sm:text-xl opacity-90 mb-6">
            Australia’s marketplace for bird lovers
          </p>

          {/* SEARCH */}
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-2.5 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-4xl mx-auto">
            <input
              type="text"
              placeholder="Search birds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2.5 text-black outline-none rounded-xl bg-gray-50"
            />

            <input
              type="text"
              placeholder="Location (e.g. Sydney)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="flex-1 p-2.5 text-black outline-none rounded-xl bg-gray-50"
            />
          </div>

          {/* ADVANCED FILTERS */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 max-w-4xl mx-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-3 text-black rounded-xl bg-white"
            >
              <option value="">All Categories</option>
              <option value="Parrots">Parrots</option>
              <option value="Cockatiels">Cockatiels</option>
              <option value="Finches">Finches</option>
              <option value="Canaries">Canaries</option>
              <option value="Supplies">Supplies</option>
            </select>

            <input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="p-3 text-black rounded-xl bg-white"
            />

            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="p-3 text-black rounded-xl bg-white"
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-3 text-black rounded-xl bg-white"
            >
              <option value="newest">Newest</option>
              <option value="lowest">Price: Low to High</option>
              <option value="highest">Price: High to Low</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div className="max-w-4xl mx-auto mt-2 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-white bg-black px-3 py-1 rounded"
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* HERO ACTIONS */}
          <div className="mt-3 flex justify-center">
            <Link href="/create">
              <button className="bg-white text-green-600 px-5 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition">
                + Post Listing
              </button>
            </Link>
          </div>

          {/* DESKTOP EXTRA ACTIONS */}
          <div className="hidden md:flex mt-3 gap-2 justify-center flex-wrap">
            <Link href="/saved-listings">
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold">
                Saved
              </button>
            </Link>

            <Link href="/my-listings">
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold">
                My Listings
              </button>
            </Link>

            <Link href="/messages">
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold">
                Messages
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="max-w-5xl mx-auto px-4 mt-4 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5">
          <h3 className="font-semibold mb-4 text-gray-800 text-base sm:text-lg">
            Popular Categories
          </h3>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 text-center">
            {[
              { name: "Parrots", emoji: "🦜" },
              { name: "Cockatiels", emoji: "🐦" },
              { name: "Finches", emoji: "🐤" },
              { name: "Canaries", emoji: "🐥" },
              { name: "Supplies", emoji: "🪺" },
            ].map((cat) => (
              <div
                key={cat.name}
                onClick={() => setCategoryFilter(cat.name)}
                className={`bg-white hover:bg-green-50 border rounded-xl p-4 cursor-pointer transition shadow-sm ${
                  categoryFilter === cat.name ? "ring-2 ring-green-500" : ""
                }`}
              >
                <div className="text-3xl">{cat.emoji}</div>
                <p className="text-sm mt-2 font-medium text-gray-700">
                  {cat.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LISTINGS */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Latest Listings</h3>
          <button className="text-sm text-green-600 hover:underline">
            View all
          </button>
        </div>

        {filteredListings.length === 0 ? (
          <p className="text-gray-500">No listings found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredListings.map((item) => (
              <Link key={item.id} href={`/listing/${item.id}`}>
                <div className="bg-white rounded-2xl shadow hover:shadow-xl hover:-translate-y-1 transition overflow-hidden cursor-pointer">
                  <div className="relative">
                    <img
                      src={
                        item.image && item.image !== ""
                          ? item.image
                          : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600"
                      }
                      alt={item.title}
                      className="h-52 sm:h-48 w-full object-cover"
                    />

                    {item.is_featured ? (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs px-2 py-1 rounded">
                        ⭐ Featured
                      </div>
                    ) : (
                      <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                        New
                      </div>
                    )}

                    {item.boost_until &&
                      new Date(item.boost_until) > new Date() && (
                        <div className="absolute top-2 left-24 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                          🚀 Boosted
                        </div>
                      )}

                    <button
                      onClick={(e) => handleToggleSave(e, item.id)}
                      className={`absolute top-2 right-2 text-xs px-3 py-1 rounded-full font-semibold ${
                        savedListingIds.includes(item.id)
                          ? "bg-red-500 text-white"
                          : "bg-white/90 text-gray-800"
                      }`}
                    >
                      {savedListingIds.includes(item.id) ? "♥ Saved" : "♡ Save"}
                    </button>
                  </div>

                  <div className="p-3">
                    <h2 className="font-semibold text-base truncate text-gray-800">
                      {item.title}
                    </h2>

                    <p className="text-green-600 font-bold text-lg mt-1">
                      ${item.price}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      📍 {item.location}
                    </p>

                    <div className="mt-2 flex gap-2 flex-wrap">
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                        {item.category || "Bird Listing"}
                      </span>
                    </div>
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
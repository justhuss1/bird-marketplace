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
};

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);

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

    if (!error) setListings(data || []);
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

  const filteredListings = listings.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesLocation = item.location
      ?.toLowerCase()
      .includes(locationFilter.toLowerCase());

    return matchesSearch && matchesLocation;
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
        <div className="absolute inset-0 bg-green-900/60" />

        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-2 leading-tight">
            Buy, Sell & Rehome Birds
          </h2>
          <p className="text-base sm:text-xl opacity-90 mb-6">
            Australia’s marketplace for bird lovers
          </p>

          {/* SEARCH */}
          <div className="bg-white rounded-2xl shadow-lg p-2.5 sm:p-4 flex flex-col sm:flex-row gap-2 sm:gap-3 max-w-4xl mx-auto">
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

          {/* HERO ACTIONS */}
          <div className="mt-4 flex justify-center">
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
      <div className="max-w-5xl mx-auto px-4 -mt-8 sm:-mt-12 mb-6">
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
                className="bg-white hover:bg-green-50 border rounded-xl p-4 cursor-pointer transition shadow-sm"
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

                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      New
                    </div>

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
                        Bird Listing
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
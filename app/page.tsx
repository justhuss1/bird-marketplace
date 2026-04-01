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

  useEffect(() => {
    fetchListings();
    getCurrentUser();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserEmail("");
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
    <main className="bg-gray-50 min-h-screen pb-20">
      {/* NAVBAR */}
      <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold text-green-600">
          🐦 Bird Marketplace
        </h1>

        <div className="flex gap-2 items-center">
          {userEmail ? (
            <>
              <span className="text-sm text-gray-600 hidden sm:block">
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login">
              <button className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm">
                Login
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* HERO */}
      <div className="bg-green-600 text-white px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-2">
            Buy, Sell & Rehome Birds
          </h2>
          <p className="mb-6 opacity-90">
            Australia’s marketplace for bird lovers
          </p>

          {/* SEARCH */}
          <div className="bg-white rounded-xl shadow p-3 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Search birds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 p-2 text-black outline-none"
            />

            <input
              type="text"
              placeholder="Location (e.g. Sydney)"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="flex-1 p-2 text-black outline-none"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-4 flex gap-2 justify-center flex-wrap">
            <Link href="/create">
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold">
                + Post Listing
              </button>
            </Link>

            <Link href="/my-listings">
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold">
                My Listings
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* CATEGORIES */}
<div className="max-w-5xl mx-auto px-4 -mt-12 mb-6">
  <div className="bg-white rounded-2xl shadow-lg p-5">
    <h3 className="font-semibold mb-4 text-gray-800">
      Popular Categories
    </h3>

    <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 text-center">
      {[
        { name: "Parrots", emoji: "🦜" },
        { name: "Cockatiels", emoji: "🐦" },
        { name: "Finches", emoji: "🐤" },
        { name: "Canaries", emoji: "🐥" },
        { name: "Supplies", emoji: "🪺" },
      ].map((cat) => (
        <div
          key={cat.name}
          className="bg-gray-50 hover:bg-green-50 border rounded-xl p-4 cursor-pointer transition"
        >
          <div className="text-3xl">{cat.emoji}</div>
          <p className="text-sm mt-2 font-medium">{cat.name}</p>
        </div>
      ))}
    </div>
  </div>
</div>

      {/* LISTINGS */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <h3 className="text-lg font-semibold mb-3">Latest Listings</h3>

        {filteredListings.length === 0 ? (
          <p className="text-gray-500">No listings found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {filteredListings.map((item) => (
              <Link key={item.id} href={`/listing/${item.id}`}>
                <div className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer">
                  <img
                    src={
                      item.image ||
                      "https://via.placeholder.com/600x400?text=No+Image"
                    }
                    alt={item.title}
                    className="h-48 w-full object-cover"
                  />

                  <div className="p-3">
                    <h2 className="font-semibold text-sm truncate">
                      {item.title}
                    </h2>

                    <p className="text-green-600 font-bold text-base mt-1">
                      ${item.price}
                    </p>

                    <p className="text-xs text-gray-500">
                      📍 {item.location}
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
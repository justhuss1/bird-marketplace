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
      <div className="relative text-white px-4 py-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-green-900/60" />
        <div className="relative max-w-4xl mx-auto text-center">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-2">
            Buy, Sell & Rehome Birds
          </h2>
          <p className="mb-6 opacity-90">
            Australia’s marketplace for bird lovers
          </p>
          </div>

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
          className="bg-white hover:bg-green-50 border rounded-xl p-4 cursor-pointer transition shadow-sm"
        >
          <div className="text-3xl">{cat.emoji}</div>
          <p className="text-sm mt-2 font-medium text-gray-700">{cat.name}</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                      className="h-48 w-full object-cover"
                    />

                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      New
                    </div>
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
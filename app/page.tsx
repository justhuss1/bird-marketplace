"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Home() {
  const [listings, setListings] = useState<any[]>([]);
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

    if (error) {
      console.error(error);
    } else {
      setListings(data || []);
    }
  };

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      setUserEmail(user.email);
    } else {
      setUserEmail("");
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Failed to log out");
      return;
    }

    setUserEmail("");
    alert("Logged out successfully");
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
      <div className="bg-green-600 text-white p-4 rounded-b-2xl">
        <h1 className="text-2xl font-bold">Bird Marketplace 🐦</h1>
        <p className="text-sm opacity-90">
          Buy, sell and rehome birds across Australia
        </p>

        <div className="mt-4 flex gap-3 flex-wrap items-center">
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

          {userEmail ? (
            <>
              <span className="text-white text-sm">
                {userEmail}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login">
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold">
                Login
              </button>
            </Link>
          )}
        </div>

        <div className="mt-6">
          <input
            type="text"
            placeholder="Search birds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 rounded-lg text-black"
          />
        </div>

        <div className="mt-2">
          <input
            type="text"
            placeholder="Filter by location (e.g. Sydney)"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full p-3 rounded-lg text-black"
          />
        </div>
      </div>

      {filteredListings.length === 0 ? (
        <p className="px-4 mt-4 text-gray-500">No listings found.</p>
      ) : (
        <div className="mt-4 px-4 grid grid-cols-2 gap-4">
          {filteredListings.map((item) => (
            <Link key={item.id} href={`/listing/${item.id}`}>
              <div className="bg-white rounded-xl shadow overflow-hidden cursor-pointer">
                <img
                  src={
                    item.image ||
                    "https://via.placeholder.com/600x400?text=No+Image"
                  }
                  alt={item.title}
                  className="h-56 w-full object-cover"
                />
                <div className="p-2">
                  <h2 className="font-semibold text-sm">{item.title}</h2>
                  <p className="text-green-600 font-bold">{item.price}</p>
                  <p className="text-xs text-gray-500">{item.location}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
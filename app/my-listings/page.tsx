"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Listing = {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string | null;
  description: string;
  user_id: string;
};

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setListings(data || []);
    }

    setLoading(false);
  };

  const handleCheckout = async (type: "feature" | "boost", id: string) => {
  const res = await fetch("/api/checkout", {
    method: "POST",
    body: JSON.stringify({ type, listingId: id }),
  });

  const data = await res.json();

  if (data.url) {
    window.location.href = data.url;
  }
};

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this listing?");
    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in.");
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      alert("Failed to delete listing");
      return;
    }

    setListings((prev) => prev.filter((listing) => listing.id !== id));
  };

  if (loading) {
    return <main className="p-4">Loading your listings...</main>;
  }

  const handleFeature = async (id: string) => {
  const { error } = await supabase
    .from("listings")
    .update({ is_featured: true })
    .eq("id", id);

  if (error) {
    alert("Failed to feature listing");
    return;
  }

  alert("Listing is now featured ⭐");
  fetchMyListings();
};

const handleBoost = async (id: string) => {
  const boostExpiry = new Date();
  boostExpiry.setDate(boostExpiry.getDate() + 7); // 7-day boost

  const { error } = await supabase
    .from("listings")
    .update({ boost_until: boostExpiry.toISOString() })
    .eq("id", id);

  if (error) {
    alert("Failed to boost listing");
    return;
  }

  alert("Listing boosted for 7 days 🚀");
  fetchMyListings();
};

  return (
    <main className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-black transition"
        >
          ← Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-500 mt-1">
              Manage the bird listings you’ve posted.
            </p>
          </div>

          <Link href="/create">
            <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition">
              + New Listing
            </button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="text-4xl mb-3">🪺</div>
            <h2 className="text-xl font-semibold text-gray-800">
              No listings yet
            </h2>
            <p className="text-gray-500 mt-2 mb-5">
              Start by creating your first bird listing.
            </p>

            <Link href="/create">
              <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-semibold transition">
                Create Listing
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {listings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden"
              >
                <Link href={`/listing/${item.id}`}>
                  <div className="relative cursor-pointer">
                    <img
                      src={
                        item.image && item.image !== ""
                          ? item.image
                          : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1200"
                      }
                      alt={item.title}
                      className="h-56 w-full object-cover"
                    />

                    <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                      Your Listing
                    </div>
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/listing/${item.id}`}>
                    <h2 className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-green-600 transition">
                      {item.title}
                    </h2>
                  </Link>

                  <p className="text-green-600 font-bold text-2xl mt-2">
                    ${item.price}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    📍 {item.location}
                  </p>

                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {item.description || "No description provided."}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <Link href={`/edit/${item.id}`} className="flex-1">
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
                        Edit
                      </button>
                    </Link>

                    <button
                      onClick={() => handleCheckout("feature", item.id)}
                      className="bg-yellow-400 text-black px-3 py-1 rounded-lg text-sm mr-2"
                    >
                      ⭐ Feature
                    </button>

                    <button
                      onClick={() => handleCheckout("boost", item.id)}
                      className="bg-purple-600 text-white px-3 py-1 rounded-lg text-sm mr-2"
                    >
                      🚀 Boost
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
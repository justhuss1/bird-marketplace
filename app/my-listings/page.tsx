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
      setLoading(false);
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

  return (
    <main className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">My Listings</h1>

          <Link href="/create">
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold">
              + New Listing
            </button>
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-600">
              You have not posted any listings yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow overflow-hidden"
              >
                <Link href={`/listing/${item.id}`}>
                  <img
                    src={
                      item.image ||
                      "https://via.placeholder.com/600x400?text=No+Image"
                    }
                    alt={item.title}
                    className="h-56 w-full object-cover cursor-pointer"
                  />
                </Link>

                <div className="p-3">
                  <Link href={`/listing/${item.id}`}>
                    <h2 className="font-semibold text-base cursor-pointer">
                      {item.title}
                    </h2>
                  </Link>

                  <p className="text-green-600 font-bold">{item.price}</p>
                  <p className="text-sm text-gray-500">{item.location}</p>

                  <div className="mt-3">
                    <Link href={`/edit/${item.id}`}>
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm mr-2">
                            Edit
                        </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
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
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function BreederProfilePage() {
  const params = useParams();
  const breederId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", breederId)
      .single();

    setProfile(profileData);

    const { data: listingsData } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", breederId);

    setListings(listingsData || []);

    if (user) {
      const { data: follow } = await supabase
        .from("follows")
        .select("*")
        .eq("user_id", user.id)
        .eq("breeder_id", breederId)
        .single();

      setIsFollowing(!!follow);
    }
  };

  const toggleFollow = async () => {
    if (!userId) return alert("Login required");

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("user_id", userId)
        .eq("breeder_id", breederId);

      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert([
        {
          user_id: userId,
          breeder_id: breederId,
        },
      ]);

      setIsFollowing(true);
    }
  };

  if (!profile) return <div className="p-6">Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <h1 className="text-2xl font-bold">
            {profile.breeder_name || "Breeder"}
          </h1>

          <p className="text-gray-500 mt-2">
            {profile.breeder_bio || "No bio yet"}
          </p>

          {profile.breeder_verified && (
            <span className="inline-block mt-2 text-green-600 text-sm">
              ✅ Verified Breeder
            </span>
          )}

          <button
            onClick={toggleFollow}
            className={`mt-4 px-5 py-2 rounded-xl text-sm font-semibold ${
              isFollowing
                ? "bg-gray-200 text-gray-800"
                : "bg-green-600 text-white"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>

        {/* LISTINGS */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">
            Listings
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {listings.map((item) => (
              <Link key={item.id} href={`/listing/${item.id}`}>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border hover:shadow-md transition">
                  <img
                    src={item.image}
                    className="h-40 w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="font-medium text-sm">
                      {item.title}
                    </p>
                    <p className="text-green-600 font-semibold">
                      ${item.price}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  username?: string | null;
  is_breeder?: boolean | null;
  breeder_name?: string | null;
  breeder_bio?: string | null;
  breeder_verified?: boolean | null;
};

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [breederName, setBreederName] = useState("");
  const [breederBio, setBreederBio] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setProfile(data);
    setBreederName(data?.breeder_name || "");
    setBreederBio(data?.breeder_bio || "");
    setLoading(false);
  };

  const handleBecomeBreeder = async () => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        alert("Please log in first.");
        return;
    }

    setSaving(true);

    const { data, error } = await supabase
        .from("profiles")
        .upsert(
        {
            id: user.id,
            is_breeder: true,
            breeder_name: breederName || profile?.username || "My Breeder Profile",
        },
        { onConflict: "id" }
        )
        .select();

    console.log("BECOME BREEDER UPSERT RESULT:", { userId: user.id, data, error });

    setSaving(false);

    if (error) {
        console.error(error);
        alert("Could not activate breeder profile.");
        return;
    }

    await fetchProfile();
    };

  const handleSaveBreederProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        breeder_name: breederName,
        breeder_bio: breederBio,
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Could not save breeder profile.");
      return;
    }

    alert("Breeder profile updated.");
    await fetchProfile();
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <p>Loading account...</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Account</h1>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900">Breeder Profile</h2>

        {!profile?.is_breeder ? (
          <>
            <p className="text-sm text-gray-500 mt-2">
              Upgrade your account to create a breeder profile and let users follow you.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breeder Name
                </label>
                <input
                  type="text"
                  value={breederName}
                  onChange={(e) => setBreederName(e.target.value)}
                  placeholder="Enter your breeder name"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                />
              </div>

              <button
                onClick={handleBecomeBreeder}
                disabled={saving}
                className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition disabled:opacity-50"
              >
                {saving ? "Activating..." : "Become a Breeder"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                Breeder Profile Active
              </span>

              {profile?.breeder_verified && (
                <span className="inline-flex text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                  Verified Breeder
                </span>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breeder Name
                </label>
                <input
                  type="text"
                  value={breederName}
                  onChange={(e) => setBreederName(e.target.value)}
                  placeholder="Breeder name"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breeder Bio
                </label>
                <textarea
                  value={breederBio}
                  onChange={(e) => setBreederBio(e.target.value)}
                  placeholder="Tell buyers about your breeding program, experience, and what makes you different."
                  rows={5}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveBreederProfile}
                  disabled={saving}
                  className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Breeder Profile"}
                </button>

                {profile?.id && (
                  <Link href={`/breeders/${profile.id}`}>
                    <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition">
                      View Public Breeder Profile
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
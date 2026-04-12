"use client";

import { supabase } from "@/lib/supabase";

export default function AccountPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900">Breeder Profile</h2>
        <p className="text-sm text-gray-500 mt-2">
          Upgrade your account to create a breeder profile and let users follow you.
        </p>

        <button
          onClick={async () => {
            const {
              data: { user },
            } = await supabase.auth.getUser();

            await supabase
              .from("profiles")
              .update({
                is_breeder: true,
                breeder_name: "My Breeder Profile",
              })
              .eq("id", user?.id);

            alert("You are now a breeder 🎉");
          }}
          className="mt-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white px-4 py-3 text-sm font-semibold"
        >
          Become a Breeder
        </button>
      </div>
    </main>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      alert(error.message);
      setSent(false);
    } else {
      setSent(true);
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-gray-50">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/30" />

      <div className="relative min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white font-semibold"
          >
            <span className="text-lg">🦜</span>
            <span>Bird Marketplace</span>
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="text-center text-white mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs sm:text-sm border border-white/20 mb-4">
                <span>Secure sign in</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Welcome back
              </h1>
              <p className="mt-3 text-sm sm:text-base text-white/90">
                Sign in to manage listings, messages, saved birds, and seller
                activity.
              </p>
            </div>

            <div className="bg-white/92 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/40">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Login</h2>
                <p className="text-sm text-gray-500 mt-2">
                  We’ll send a secure magic link to your email.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white text-black outline-none focus:ring-2 focus:ring-green-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl font-semibold transition shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Send Login Link"}
                </button>

                {sent && (
                  <div className="rounded-2xl bg-green-50 border border-green-100 p-4 text-sm text-green-700">
                    Login link sent. Check your email and open the link on this
                    device.
                  </div>
                )}

                <p className="text-xs text-gray-500 text-center">
                  By continuing, you’re using a password-free secure login.
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-gray-50 p-3">
                  <div className="text-lg mb-1">🛡️</div>
                  <p className="text-xs font-medium text-gray-800">
                    Verified accounts
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3">
                  <div className="text-lg mb-1">💬</div>
                  <p className="text-xs font-medium text-gray-800">
                    Secure messaging
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-3">
                  <div className="text-lg mb-1">🐦</div>
                  <p className="text-xs font-medium text-gray-800">
                    Built for bird lovers
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-white/80 text-xs mt-6">
              Having trouble? Try opening the login email in the same browser.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
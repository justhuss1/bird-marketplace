"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bird, Mail, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email) {
      alert("Please enter your email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for your login link.");
    }

    setLoading(false);
  };

  return (
    <main className="bg-gray-50 min-h-screen px-4 py-8 pb-24">
      <div className="max-w-md mx-auto">
        <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#07111f] via-[#102038] to-[#1b2e4a] px-6 py-8 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 mb-4">
              <ShieldCheck size={14} />
              Secure sign in
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                <Bird size={20} />
              </div>
              <div>
                <p className="text-sm text-white/70">Welcome to</p>
                <h1 className="text-2xl font-bold leading-tight">
                  Pet Marketplace
                </h1>
              </div>
            </div>

            <p className="text-sm sm:text-base text-white/80 leading-7">
              Sign in to create listings, save pets, message sellers, and manage
              your marketplace activity.
            </p>
          </div>

          <div className="px-6 py-6">
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Mail size={16} />
                Email address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full mt-5 rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3.5 text-sm font-semibold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending login link..." : "Send Login Link"}
            </button>

            <p className="mt-4 text-xs text-gray-500 leading-6">
              We’ll email you a secure magic link so you can sign in without a
              password.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
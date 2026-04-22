"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      alert("Please enter your email.");
      return;
    }

    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      alert(error.message || "Could not send reset email.");
      return;
    }

    alert("Password reset email sent. Please check your inbox.");
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-6 items-stretch">
        <section className="hidden lg:flex rounded-[32px] overflow-hidden border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between p-10 bg-gradient-to-br from-[#111827] via-[#182131] to-[#223048] text-white min-h-full">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                Pet Marketplace
              </div>

              <h1 className="mt-6 text-4xl font-bold leading-tight">
                Reset your password
              </h1>

              <p className="mt-4 text-white/75 leading-7 max-w-md">
                Enter your email and we’ll send you a secure link so you can set a new password.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 border border-white/10 p-5">
              <p className="text-sm font-semibold">Quick recovery</p>
              <p className="mt-2 text-sm text-white/70">
                Once you open the email link, you’ll be taken straight to a secure reset screen.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-gray-100 bg-white shadow-sm p-6 sm:p-8">
          <div className="max-w-md mx-auto">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition"
            >
              <ArrowLeft size={16} />
              Back to login
            </Link>

            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Forgot password
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-6">
              Enter the email linked to your account.
            </p>

            <form onSubmit={handleResetRequest} className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:border-green-500">
                  <Mail size={18} className="text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white py-3.5 text-sm font-semibold transition shadow-sm disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-6 text-sm text-gray-500">
              Remembered your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-green-700 hover:text-green-800 transition"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

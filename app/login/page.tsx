"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Eye,
  EyeOff,
  ArrowRight,
  UserCircle2,
  LockKeyhole,
} from "lucide-react";
import FormMessage from "@/components/FormMessage";

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      setFormError("Please enter your email or username and password.");
      return;
    }

    setLoading(true);

    try {
      let resolvedEmail = trimmedIdentifier.toLowerCase();

      if (!trimmedIdentifier.includes("@")) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username_lower", trimmedIdentifier.toLowerCase())
          .maybeSingle();

        if (profileError || !profileData?.email) {
          setLoading(false);
          setFormError("No account found with that username.");
          return;
        }

        resolvedEmail = profileData.email.toLowerCase();
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password: trimmedPassword,
      });

      setLoading(false);

      if (error) {
        console.error(error);
        setFormError(error.message || "Could not log in.");
        return;
      }

      setFormSuccess("Logged in successfully.");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(error);
      setLoading(false);
      setFormError("Something went wrong while logging in.");
    }
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
                Welcome back
              </h1>

              <p className="mt-4 text-white/75 leading-7 max-w-md">
                Log in to manage your listings, message buyers and sellers, save favourites, and keep up with breeder updates.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-3xl bg-white/10 border border-white/10 p-5">
                <p className="text-sm font-semibold">Faster selling</p>
                <p className="mt-2 text-sm text-white/70">
                  Manage ads, mark listings sold, and stay on top of conversations.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 border border-white/10 p-5">
                <p className="text-sm font-semibold">Safer communication</p>
                <p className="mt-2 text-sm text-white/70">
                  Keep messages and attachments in one secure place.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-gray-100 bg-white shadow-sm p-6 sm:p-8">
          <div className="max-w-md mx-auto">
            <div className="lg:hidden">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 border border-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                Pet Marketplace
              </div>
            </div>

            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              Log in
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-6">
              Use your email or username and password to access your account.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email or Username
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:border-green-500">
                  <UserCircle2 size={18} className="text-gray-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your email or username"
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:border-green-500">
                  <LockKeyhole size={18} className="text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <FormMessage type="error" message={formError} />
              <FormMessage type="success" message={formSuccess} />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white py-3.5 text-sm font-semibold transition shadow-sm disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Log In"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between gap-3 text-sm">
              <Link
                href="/forgot-password"
                className="text-gray-500 hover:text-gray-900 transition"
              >
                Forgot password?
              </Link>

              <Link
                href="/signup"
                className="inline-flex items-center gap-2 font-semibold text-green-700 hover:text-green-800 transition"
              >
                Create account
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
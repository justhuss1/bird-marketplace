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
  Mail,
  LockKeyhole,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidUsername = (value: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(value);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedEmail || !trimmedPassword) {
      alert("Please complete all fields.");
      return;
    }

    if (!isValidUsername(trimmedUsername)) {
      alert(
        "Username must be 3 to 20 characters and can only contain letters, numbers, and underscores."
      );
      return;
    }

    if (trimmedPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data: existingUsername, error: usernameCheckError } = await supabase
        .from("profiles")
        .select("id")
        .eq("username_lower", trimmedUsername.toLowerCase())
        .maybeSingle();

      if (usernameCheckError) {
        console.error(usernameCheckError);
        setLoading(false);
        alert("Could not validate username. Please try again.");
        return;
      }

      if (existingUsername) {
        setLoading(false);
        alert("That username is already taken.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (error) {
        console.error(error);
        setLoading(false);
        alert(error.message || "Could not create account.");
        return;
      }

      const userId = data.user?.id;

      if (userId) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: userId,
          username: trimmedUsername,
          username_lower: trimmedUsername.toLowerCase(),
        });

        if (profileError) {
          console.error(profileError);
          setLoading(false);
          alert("Account created, but profile setup failed. Please contact support or try logging in.");
          return;
        }
      }

      setLoading(false);

      if (data.session) {
        alert("Account created successfully.");
        router.push("/");
        router.refresh();
      } else {
        alert("Account created. Please check your email to confirm your account.");
        router.push("/login");
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("Something went wrong while creating your account.");
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
                Create your account
              </h1>

              <p className="mt-4 text-white/75 leading-7 max-w-md">
                Join the marketplace to post listings, message users, save favourites, and build your breeder profile later if you want.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-3xl bg-white/10 border border-white/10 p-5">
                <p className="text-sm font-semibold">Buy and sell faster</p>
                <p className="mt-2 text-sm text-white/70">
                  Create listings, chat securely, and manage your account in one place.
                </p>
              </div>

              <div className="rounded-3xl bg-white/10 border border-white/10 p-5">
                <p className="text-sm font-semibold">Build trust</p>
                <p className="mt-2 text-sm text-white/70">
                  Create your profile, save favourites, and upgrade to a breeder profile later.
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
              Sign up
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-6">
              Create your account with a username, email, and password.
            </p>

            <form onSubmit={handleSignup} className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:border-green-500">
                  <UserCircle2 size={18} className="text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    autoComplete="username"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  3–20 characters. Letters, numbers, and underscores only.
                </p>
              </div>

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
                    placeholder="Create a password"
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    autoComplete="new-password"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white py-3.5 text-sm font-semibold transition shadow-sm disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-green-700 hover:text-green-800 transition"
              >
                Log in
              </Link>
            </div>

            <div className="mt-4 text-xs text-gray-400 leading-6">
              By signing up, you can create listings, message users, save favourites, and later activate breeder features from your account page.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
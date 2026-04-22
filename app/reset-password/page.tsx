"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, LockKeyhole, ArrowLeft } from "lucide-react";
import FormMessage from "@/components/FormMessage";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  useEffect(() => {
    const init = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error(error);
          setFormError("This reset link is invalid or has expired.");
          router.push("/forgot-password");
          return;
        }
      }

      setReady(true);
    };

    init();
  }, [router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!password.trim() || !confirmPassword.trim()) {
      setFormError("Please complete both password fields.");
      return;
    }

    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setFormError(error.message || "Could not reset password.");
      return;
    }

    setFormSuccess("Password updated successfully.");
    setTimeout(() => router.push("/login"), 1200);
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] px-4 py-8 sm:py-12">
        <div className="max-w-xl mx-auto rounded-[32px] border border-gray-100 bg-white shadow-sm p-8">
          <p className="text-gray-700">Preparing password reset...</p>
        </div>
      </main>
    );
  }

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
                Create a new password
              </h1>

              <p className="mt-4 text-white/75 leading-7 max-w-md">
                Choose a new password for your account so you can get back into the marketplace securely.
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 border border-white/10 p-5">
              <p className="text-sm font-semibold">Security tip</p>
              <p className="mt-2 text-sm text-white/70">
                Use a password that’s hard to guess and different from your old one.
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
              Reset password
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-6">
              Enter your new password below.
            </p>

            <form onSubmit={handleResetPassword} className="mt-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New password
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:border-green-500">
                  <LockKeyhole size={18} className="text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm new password
                </label>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 focus-within:border-green-500">
                  <LockKeyhole size={18} className="text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <FormMessage type="error" message={formError} />
              <FormMessage type="success" message={formSuccess} />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white py-3.5 text-sm font-semibold transition shadow-sm disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

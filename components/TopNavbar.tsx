"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Bird,
  ChevronDown,
  Heart,
  Bell,
  MessageCircle,
  PlusSquare,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

type Profile = {
  id: string;
  username: string | null;
};

export default function TopNavbar() {
  const [userEmail, setUserEmail] = useState("");
  const [username, setUsername] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getCurrentUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserEmail("");
      setUsername("");
      return;
    }

    setUserEmail(user.email || "");

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", user.id)
      .maybeSingle();

    setUsername(profileData?.username || "");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    setUserEmail("");
    setUsername("");
    window.location.href = "/";
  };

  const displayName = username || "My Account";
  const avatarLetter = (username || userEmail || "A").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-green-600 font-semibold text-base sm:text-lg"
          >
            <Bird size={18} />
            <span>Pet Marketplace</span>
          </Link>

          {!userEmail ? (
            <Link href="/login">
              <button className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-semibold transition">
                Login
              </button>
            </Link>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 px-2.5 py-2 transition"
              >
                <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-sm">
                  {avatarLetter}
                </div>

                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 max-w-[140px] truncate">
                    {displayName}
                  </p>
                  <p className="text-xs text-gray-500 max-w-[160px] truncate">
                    {userEmail}
                  </p>
                </div>

                <ChevronDown
                  size={16}
                  className={`text-gray-500 transition ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-3 w-[280px] rounded-3xl border border-gray-100 bg-white shadow-xl overflow-hidden">
                  <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold">
                        {avatarLetter}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <p className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-[0.14em] text-gray-400">
                      Account
                    </p>

                    <Link
                      href="/my-listings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <LayoutDashboard size={16} />
                      My Listings
                    </Link>

                    <Link
                      href="/saved-listings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Heart size={16} />
                      Saved Listings
                    </Link>

                    <Link
                      href="/messages"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <MessageCircle size={16} />
                      Messages
                    </Link>

                    <Link
                      href="/notifications"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <Bell size={16} />
                      Notifications
                    </Link>

                    <p className="px-3 pt-3 pb-1 text-[11px] uppercase tracking-[0.14em] text-gray-400">
                      Actions
                    </p>

                    <Link
                      href="/create"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                    >
                      <PlusSquare size={16} />
                      Post a Listing
                    </Link>

                    <div className="my-2 border-t border-gray-100" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import {
  ChevronDown,
  Heart,
  Bell,
  MessageCircle,
  PlusSquare,
  LayoutDashboard,
  LogOut,
  UserCircle2,
  Sparkles,
} from "lucide-react";

type Profile = {
  id: string;
  username: string | null;
};

export default function TopNavbar() {
  const [userEmail, setUserEmail] = useState("");
  const [username, setUsername] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string>("");
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
    if (!userId) return;

    fetchUnreadNotifications(userId);

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnreadNotifications(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

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
      setUserId("");
      setUnreadCount(0);
      return;
    }

    setUserId(user.id);
    setUserEmail(user.email || "");

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", user.id)
      .maybeSingle();

    setUsername(profileData?.username || "");
  };

  const fetchUnreadNotifications = async (id: string) => {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id)
      .eq("is_read", false);

    if (error) {
      console.error(error);
      return;
    }

    setUnreadCount(count || 0);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    setUserEmail("");
    setUsername("");
    setUserId("");
    setUnreadCount(0);
    window.location.href = "/";
  };

  const displayName = username || "My Account";
  const avatarLetter = (username || userEmail || "A").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/70 bg-[#f7f7f5]/92 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-[74px] sm:h-[78px] relative flex items-center justify-between">

          {/* ================= MOBILE LAYOUT ================= */}
          <div className="flex sm:hidden items-center justify-between w-full">

            {/* LEFT */}
{!userEmail ? (
  <Link href="/login">
    <button className="rounded-2xl border border-gray-200 bg-white px-4 h-11 text-sm font-semibold text-gray-900 shadow-sm">
      Login
    </button>
  </Link>
) : (
  <div className="relative" ref={dropdownRef}>
    <button
      onClick={() => setMenuOpen((prev) => !prev)}
      className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold shadow-sm"
    >
      {avatarLetter}
    </button>

    {menuOpen && (
      <div className="absolute left-0 mt-3 w-[290px] rounded-[28px] border border-gray-200 bg-white shadow-2xl overflow-hidden z-50">

        <div className="px-4 py-4 border-b border-gray-100 bg-[#fbfbfa]">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold shrink-0">
              {avatarLetter}

              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </p>

              <p className="text-xs text-gray-500 truncate">
                {userEmail}
              </p>

              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
                <Sparkles size={11} />
                Account active
              </div>
            </div>
          </div>
        </div>

        <div className="p-2.5">

          <Link
            href="/account"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <UserCircle2 size={16} />
            My Account
          </Link>

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
            className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <span className="flex items-center gap-3">
              <Bell size={16} />
              Notifications
            </span>

            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 text-white text-[11px] font-semibold px-2 py-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

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

            {/* CENTER */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
            >
              <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-1.5">
                <Image
                  src="/branding/logo-navbar.png"
                  alt="Pet Marketplace"
                  width={34}
                  height={34}
                  className="rounded-xl"
                  priority
                />
              </div>

              <div className="leading-tight">
                <p className="text-[15px] font-bold tracking-tight text-gray-900">
                  Pet Marketplace
                </p>

                <p className="text-[11px] text-gray-500">
                  Buy, sell & discover pets
                </p>
              </div>
            </Link>

            {/* RIGHT */}
            <Link href="/notifications" className="relative">
              <button className="relative w-11 h-11 rounded-2xl border border-gray-200 bg-white flex items-center justify-center shadow-sm">
                <Bell size={18} className="text-gray-700" />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </Link>
          </div>

          {/* ================= DESKTOP LAYOUT ================= */}
          <div className="hidden sm:flex items-center justify-between w-full gap-3">

            {/* LEFT */}
            <Link href="/" className="min-w-0 flex items-center gap-3">
              <div className="shrink-0 rounded-2xl bg-white border border-gray-200 shadow-sm p-1.5">
                <Image
                  src="/branding/logo-navbar.png"
                  alt="Pet Marketplace"
                  width={38}
                  height={38}
                  className="rounded-xl"
                  priority
                />
              </div>

              <div className="min-w-0">
                <p className="truncate text-[19px] font-bold tracking-tight text-gray-900">
                  Pet Marketplace
                </p>

                <p className="text-xs text-gray-500">
                  Buy, sell & discover pets
                </p>
              </div>
            </Link>

            {/* RIGHT */}
            {!userEmail ? (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <button className="rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-4 py-2.5 text-sm font-semibold transition shadow-sm">
                    Login
                  </button>
                </Link>

                <Link href="/signup">
                  <button className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 text-sm font-semibold transition shadow-sm">
                    Sign up
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/notifications" className="relative shrink-0">
                  <button className="relative w-11 h-11 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 flex items-center justify-center transition shadow-sm">
                    <Bell size={18} className="text-gray-700" />

                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold flex items-center justify-center shadow">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setMenuOpen((prev) => !prev)}
                    className="flex items-center gap-3 rounded-[22px] border border-gray-200 bg-white hover:bg-gray-50 pl-2.5 pr-3 py-2 transition shadow-sm"
                  >
                    <div className="relative w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-sm shrink-0">
                      {avatarLetter}
                    </div>

                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold text-gray-900 max-w-[130px] truncate">
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
                  <div className="absolute right-0 mt-3 w-[300px] sm:w-[320px] rounded-[28px] border border-gray-200 bg-white shadow-2xl overflow-hidden">
                    <div className="px-4 py-4 border-b border-gray-100 bg-[#fbfbfa]">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold shrink-0">
                          {avatarLetter}
                          {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {userEmail}
                          </p>

                          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-700">
                            <Sparkles size={11} />
                            Account active
                          </div>
                        </div>

                        {unreadCount > 0 && (
                          <span className="rounded-full bg-red-500 text-white text-[11px] font-semibold px-2 py-1">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-2.5">
                      <p className="px-3 pt-2 pb-1.5 text-[11px] uppercase tracking-[0.14em] text-gray-400">
                        Account
                      </p>

                      <Link
                        href="/account"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <UserCircle2 size={16} />
                        My Account
                      </Link>

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
                        className="flex items-center justify-between rounded-2xl px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <span className="flex items-center gap-3">
                          <Bell size={16} />
                          Notifications
                        </span>

                        {unreadCount > 0 && (
                          <span className="rounded-full bg-red-500 text-white text-[11px] font-semibold px-2 py-1">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </Link>

                      <p className="px-3 pt-3 pb-1.5 text-[11px] uppercase tracking-[0.14em] text-gray-400">
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
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
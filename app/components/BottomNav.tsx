"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/saved-listings", label: "Saved", icon: "❤️" },
    { href: "/create", label: "Post", icon: "➕" },
    { href: "/messages", label: "Messages", icon: "💬" },
    { href: "/notifications", label: "Alerts", icon: "🔔" },
  ];

  useEffect(() => {
    fetchUnreadCount();
    subscribeToNotifications();
  }, []);

  const fetchUnreadCount = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("No user found for unread count");
      setUnreadCount(0);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Unread fetch error:", error);
      return;
    }

    setUnreadCount(data?.length || 0);
  };

  const subscribeToNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-t md:hidden">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          const isNotifications = item.href === "/notifications";

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center text-[10px] gap-1 relative"
            >
              <div
                className={`relative transition ${
                  isActive ? "text-green-600" : "text-gray-400"
                }`}
              >
                <span className="text-xl">{item.icon}</span>

                {isNotifications && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              <span
                className={`${
                  isActive ? "text-green-600 font-medium" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
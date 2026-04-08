"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Bell,
  MessageCircle,
  CheckCheck,
  ExternalLink,
} from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setNotifications((data || []) as Notification[]);
    setLoading(false);
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((item) => !item.is_read);
    if (unread.length === 0) return;

    const ids = unread.map((item) => item.id);

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", ids);

    if (error) {
      console.error(error);
      alert("Failed to mark notifications as read.");
      return;
    }

    setNotifications((prev) =>
      prev.map((item) => ({ ...item, is_read: true }))
    );
  };

  const markOneAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    );
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  if (loading) {
    return <main className="p-4">Loading notifications...</main>;
  }

  return (
    <main className="bg-gray-50 min-h-screen py-6 sm:py-8 px-4 pb-24">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="mt-5 bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#07111f] via-[#102038] to-[#1b2e4a] px-6 sm:px-8 py-8 sm:py-10 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 mb-3">
                  <Bell size={14} />
                  Activity centre
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                  Notifications
                </h1>

                <p className="mt-3 text-white/80 max-w-2xl text-sm sm:text-base leading-7">
                  Stay updated with new messages, listing activity, and seller or
                  buyer interactions.
                </p>
              </div>

              <div className="text-sm text-white/75">
                {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 border-b border-gray-100 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Your recent marketplace activity
            </div>

            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          </div>

          <div className="px-6 sm:px-8 py-6">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                  <Bell size={24} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  No notifications yet
                </h2>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                  When someone messages you or interacts with your listings,
                  your updates will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((item) => {
                  const content = (
                    <div
                      className={`rounded-3xl border p-5 transition ${
                        item.is_read
                          ? "bg-white border-gray-100"
                          : "bg-green-50/50 border-green-100"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shrink-0">
                          <MessageCircle size={18} className="text-green-600" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900">
                                {item.title}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1 leading-6">
                                {item.message}
                              </p>
                            </div>

                            <span className="text-xs text-gray-400 shrink-0">
                              {formatTime(item.created_at)}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center gap-3">
                            {!item.is_read && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  markOneAsRead(item.id);
                                }}
                                className="text-xs font-medium text-green-700 hover:text-green-800 transition"
                              >
                                Mark as read
                              </button>
                            )}

                            {item.link && (
                              <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                <ExternalLink size={12} />
                                Open
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  if (item.link) {
                    return (
                      <Link key={item.id} href={item.link}>
                        <div
                          onClick={() => {
                            if (!item.is_read) markOneAsRead(item.id);
                          }}
                        >
                          {content}
                        </div>
                      </Link>
                    );
                  }

                  return <div key={item.id}>{content}</div>;
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
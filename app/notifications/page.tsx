"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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
    } else {
      setNotifications(data || []);
    }

    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, is_read: true } : item
      )
    );
  };

  if (loading) {
    return <main className="p-4">Loading notifications...</main>;
  }

  return (
    <main className="bg-gray-50 min-h-screen py-8 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-black transition"
        >
          ← Back
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            Updates about messages and activity.
          </p>
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <h2 className="text-xl font-semibold text-gray-800">
              No notifications yet
            </h2>
            <p className="text-gray-500 mt-2">
              When something happens, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((item) => {
              const content = (
                <div
                  className={`bg-white rounded-2xl shadow p-4 ${
                    !item.is_read ? "border-l-4 border-green-600" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {item.title}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {item.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>

                    {!item.is_read && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          markAsRead(item.id);
                        }}
                        className="text-sm text-green-600 hover:underline"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              );

              return item.link ? (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => markAsRead(item.id)}
                >
                  {content}
                </Link>
              ) : (
                <div key={item.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
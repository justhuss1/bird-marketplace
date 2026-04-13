"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CalendarDays, Sparkles } from "lucide-react";

type BreederUpdate = {
  id: string;
  breeder_id: string;
  title: string;
  content: string;
  post_type: string;
  expected_date?: string | null;
  created_at?: string | null;
  profiles?: {
    id: string;
    username?: string | null;
    breeder_name?: string | null;
    breeder_verified?: boolean | null;
  } | null;
};

export default function UpcomingLittersPage() {
  const [updates, setUpdates] = useState<BreederUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming_litter" | "available_soon">("all");

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("breeder_announcements")
      .select(`
        *,
        profiles (
          id,
          username,
          breeder_name,
          breeder_verified
        )
      `)
      .in("post_type", ["upcoming_litter", "available_soon"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setUpdates((data || []) as BreederUpdate[]);
    setLoading(false);
  };

  const filteredUpdates = useMemo(() => {
    if (filter === "all") return updates;
    return updates.filter((item) => item.post_type === filter);
  }, [updates, filter]);

  const formatType = (type: string) => {
    if (type === "upcoming_litter") return "Upcoming Litter";
    if (type === "available_soon") return "Available Soon";
    return "Update";
  };

  const formatDate = (date?: string | null) => {
    if (!date) return null;

    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 pb-24">
      <div className="max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <section className="mt-5 rounded-[32px] overflow-hidden border border-gray-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#07111f] via-[#102038] to-[#1b2e4a] px-6 sm:px-8 py-10 sm:py-12 text-white">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-medium text-white/90">
                <Sparkles size={13} />
                Breeder network
              </div>

              <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
                Upcoming Litters
              </h1>

              <p className="mt-4 text-sm sm:text-base text-white/75 leading-7 max-w-2xl">
                Discover breeder updates, planned litters, and pets becoming available soon.
                Follow breeders to stay ahead before listings go live.
              </p>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === "all"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                All Updates
              </button>

              <button
                onClick={() => setFilter("upcoming_litter")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === "upcoming_litter"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Upcoming Litters
              </button>

              <button
                onClick={() => setFilter("available_soon")}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === "available_soon"
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                Available Soon
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {loading ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              Loading updates...
            </div>
          ) : filteredUpdates.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              <h2 className="text-xl font-semibold text-gray-900">
                No updates found
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                There are no breeder updates in this category yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredUpdates.map((post) => {
                const breederName =
                  post.profiles?.breeder_name ||
                  post.profiles?.username ||
                  "Breeder";

                return (
                  <article
                    key={post.id}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                        {formatType(post.post_type)}
                      </span>

                      {post.expected_date && (
                        <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                          <CalendarDays size={12} />
                          {formatDate(post.expected_date)}
                        </span>
                      )}

                      {post.profiles?.breeder_verified && (
                        <span className="inline-flex text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                          Verified Breeder
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-gray-900">
                      {post.title}
                    </h2>

                    <p className="mt-3 text-sm text-gray-600 leading-7 whitespace-pre-line">
                      {post.content}
                    </p>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {breederName}
                        </p>
                        <p className="text-xs text-gray-400">
                          Posted {formatDate(post.created_at)}
                        </p>
                      </div>

                      <Link href={`/breeders/${post.breeder_id}`}>
                        <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2.5 text-sm font-semibold transition">
                          View Breeder
                        </button>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
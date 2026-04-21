"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ListingCard from "@/components/ListingCard";
import {
  ArrowLeft,
  Star,
  UserPlus,
  UserCheck,
  BadgeCheck,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

type Profile = {
  id: string;
  username: string | null;
  breeder_name?: string | null;
  breeder_bio?: string | null;
  breeder_verified?: boolean | null;
  is_breeder?: boolean | null;
  created_at?: string | null;
};

type Listing = {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string | null;
  category?: string | null;
  is_featured?: boolean | null;
  created_at?: string | null;
  expires_at?: string | null;
  is_expired?: boolean | null;
  status?: "available" | "pending" | "sold" | null;
};

type Announcement = {
  id: string;
  title: string;
  content: string;
  post_type: string;
  expected_date?: string | null;
  created_at?: string | null;
};

export default function BreederProfilePage() {
  const params = useParams();
  const router = useRouter();
  const breederId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const [ratingAvg, setRatingAvg] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);

  useEffect(() => {
    if (breederId) {
      fetchData();
    }
  }, [breederId]);

  const formatPostType = (postType: string) => {
    if (postType === "upcoming_litter") return "Upcoming Litter";
    if (postType === "available_soon") return "Available Soon";
    return "Announcement";
  };

  const formatDate = (date?: string | null) => {
    if (!date) return null;

    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatJoinedDate = (date?: string | null) => {
    if (!date) return "Recently joined";

    return `Member since ${new Date(date).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    })}`;
  };

  const fetchRatingsSummary = async (profileId: string) => {
    const { data, error } = await supabase
      .from("ratings")
      .select("rating")
      .eq("reviewed_user_id", profileId);

    if (error) {
      console.error(error);
      return;
    }

    const rows = data || [];
    const count = rows.length;

    if (count === 0) {
      setRatingAvg(null);
      setRatingCount(0);
      return;
    }

    const total = rows.reduce((sum, row) => sum + row.rating, 0);
    setRatingAvg(total / count);
    setRatingCount(count);
  };

  const fetchRecentReviews = async (profileId: string) => {
    const { data, error } = await supabase
      .from("ratings")
      .select("id, rating, review, created_at")
      .eq("reviewed_user_id", profileId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error(error);
      return;
    }

    setRecentReviews(data || []);
  };

  const fetchSavedListings = async (currentUserId?: string | null) => {
    const resolvedUserId = currentUserId ?? userId;

    if (!resolvedUserId) {
      setSavedListingIds([]);
      return;
    }

    const { data, error } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", resolvedUserId);

    if (error) {
      console.error(error);
      return;
    }

    setSavedListingIds((data || []).map((item) => item.listing_id));
  };

  const fetchData = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const currentUserId = user?.id || null;
    setUserId(currentUserId);

    const { data: announcementData, error: announcementError } = await supabase
      .from("breeder_announcements")
      .select("*")
      .eq("breeder_id", breederId)
      .order("created_at", { ascending: false });

    if (announcementError) {
      console.error(announcementError);
    } else {
      setAnnouncements((announcementData || []) as Announcement[]);
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", breederId)
      .single();

    if (profileError) {
      console.error(profileError);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile);
    await fetchRatingsSummary(breederId);
    await fetchRecentReviews(breederId);

    const { data: listingsData, error: listingsError } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", breederId)
      .gt("expires_at", new Date().toISOString())
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (listingsError) {
      console.error(listingsError);
    } else {
      setListings((listingsData || []) as Listing[]);
    }

    const { count, error: countError } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("breeder_id", breederId);

    if (countError) {
      console.error(countError);
    } else {
      setFollowerCount(count || 0);
    }

    if (currentUserId) {
      const { data: follow, error: followError } = await supabase
        .from("follows")
        .select("*")
        .eq("user_id", currentUserId)
        .eq("breeder_id", breederId)
        .maybeSingle();

      if (followError) {
        console.error(followError);
      }

      setIsFollowing(!!follow);
      await fetchSavedListings(currentUserId);
    } else {
      setIsFollowing(false);
      setSavedListingIds([]);
    }

    setLoading(false);
  };

  const toggleFollow = async () => {
    if (!userId) {
      alert("Please log in to follow this breeder.");
      router.push("/login");
      return;
    }

    if (userId === breederId) {
      alert("This is your breeder profile.");
      return;
    }

    setFollowLoading(true);

    if (isFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("user_id", userId)
        .eq("breeder_id", breederId);

      if (error) {
        console.error(error);
        alert("Could not unfollow breeder.");
        setFollowLoading(false);
        return;
      }

      setIsFollowing(false);
      setFollowerCount((prev) => Math.max(0, prev - 1));
    } else {
      const { error } = await supabase.from("follows").insert([
        {
          user_id: userId,
          breeder_id: breederId,
        },
      ]);

      if (error) {
        console.error(error);
        alert("Could not follow breeder.");
        setFollowLoading(false);
        return;
      }

      setIsFollowing(true);
      setFollowerCount((prev) => prev + 1);
    }

    setFollowLoading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] px-4 py-8">
        <div className="max-w-6xl mx-auto">Loading breeder profile...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Breeder profile not found
            </h1>
            <p className="mt-2 text-gray-500">
              This breeder profile may not exist yet.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const breederDisplayName =
    profile.breeder_name || profile.username || "Breeder";

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-6 sm:py-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* HERO */}
        <section className="mt-5 overflow-hidden rounded-[32px] border border-gray-100 shadow-sm bg-white">
          <div className="px-6 sm:px-8 py-8 sm:py-10 bg-white">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-green-50 border border-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
                  {breederDisplayName?.charAt(0)?.toUpperCase() || "B"}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-gray-900">
                      {breederDisplayName}
                    </h1>

                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      <Star size={12} />
                      Breeder
                    </span>

                    {profile.breeder_verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        <BadgeCheck size={12} />
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="mt-3 max-w-2xl text-sm sm:text-base text-gray-600 leading-7">
                    {profile.breeder_bio ||
                      "This breeder has not added a bio yet."}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span>{formatJoinedDate(profile.created_at)}</span>

                    <span className="inline-flex items-center gap-1.5">
                      <Star size={15} className="text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-gray-900">
                        {ratingAvg ? ratingAvg.toFixed(1) : "New"}
                      </span>
                      <span>
                        ({ratingCount} review{ratingCount === 1 ? "" : "s"})
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {userId !== breederId && (
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition shadow-sm ${
                    isFollowing
                      ? "bg-gray-900 text-white hover:bg-black"
                      : "bg-green-600 text-white hover:bg-green-700"
                  } disabled:opacity-50`}
                >
                  {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                  {followLoading
                    ? "Please wait..."
                    : isFollowing
                    ? "Following"
                    : "Follow Breeder"}
                </button>
              )}
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 border-t border-gray-100 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-white px-4 py-4 border border-gray-100">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                  Followers
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {followerCount}
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-4 border border-gray-100">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                  Active Listings
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {listings.length}
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-4 border border-gray-100">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                  Profile Type
                </p>
                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {profile.breeder_verified ? "Verified Breeder" : "Breeder"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ANNOUNCEMENTS */}
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Updates
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                Breeder Announcements
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Follow this breeder for future updates, litters, and availability.
              </p>
            </div>
          </div>

          {announcements.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No announcements yet
              </h3>
              <p className="text-gray-500 mt-2">
                This breeder has not posted any updates yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                      {formatPostType(post.post_type)}
                    </span>

                    {post.expected_date && (
                      <span className="inline-flex text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                        Expected: {formatDate(post.expected_date)}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900">
                    {post.title}
                  </h3>

                  <p className="mt-3 text-sm text-gray-700 leading-7 whitespace-pre-line">
                    {post.content}
                  </p>

                  <p className="mt-4 text-xs text-gray-400 inline-flex items-center gap-1">
                    <CalendarDays size={12} />
                    Posted {formatDate(post.created_at)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* REVIEWS */}
        {recentReviews.length > 0 && (
          <section className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                  Reviews
                </p>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                  Recent Reviews
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Feedback from buyers and marketplace users.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentReviews.map((review) => (
                <article
                  key={review.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6"
                >
                  <div className="flex items-center gap-2">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    <p className="text-sm font-semibold text-gray-900">
                      {review.rating}/5
                    </p>
                  </div>

                  {review.review && (
                    <p className="mt-3 text-sm text-gray-700 leading-7 whitespace-pre-line">
                      {review.review}
                    </p>
                  )}

                  <p className="mt-4 text-xs text-gray-400">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* LISTINGS */}
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Listings
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                Active Listings
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Browse pets and listings from this breeder.
              </p>
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              <h3 className="text-xl font-semibold text-gray-900">
                No active listings yet
              </h3>
              <p className="text-gray-500 mt-2">
                This breeder has not posted any listings yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
              {listings.map((item) => (
                <ListingCard
                  key={item.id}
                  item={{
                    ...item,
                    profiles: {
                      username: profile.username,
                      breeder_name: profile.breeder_name,
                      breeder_verified: profile.breeder_verified,
                      is_breeder: profile.is_breeder,
                    },
                  }}
                  compact
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
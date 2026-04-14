"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { notifyBreederFollowersOfAnnouncement } from "@/lib/breederAnnouncementNotifications";
import {
  BadgeCheck,
  Pencil,
  Save,
  X,
  Megaphone,
  Users,
  LayoutGrid,
  Sparkles,
  Eye,
  CalendarDays,
  ArrowRight,
  Star,
} from "lucide-react";

type Profile = {
  id: string;
  username?: string | null;
  is_breeder?: boolean | null;
  breeder_name?: string | null;
  breeder_bio?: string | null;
  breeder_verified?: boolean | null;
  created_at?: string | null;
};

type Announcement = {
  id: string;
  breeder_id: string;
  title: string;
  content: string;
  post_type: string;
  expected_date?: string | null;
  created_at?: string | null;
};

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [breederName, setBreederName] = useState("");
  const [breederBio, setBreederBio] = useState("");

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("announcement");
  const [expectedDate, setExpectedDate] = useState("");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [myAnnouncements, setMyAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchMyAnnouncements = async (profileId: string) => {
    const { data, error } = await supabase
      .from("breeder_announcements")
      .select("*")
      .eq("breeder_id", profileId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setMyAnnouncements((data || []) as Announcement[]);
  };

  const fetchBreederStats = async (profileId: string) => {
    const [{ count: listingsCount, error: listingsError }, { count: followsCount, error: followsError }] =
      await Promise.all([
        supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profileId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("breeder_id", profileId),
      ]);

    if (listingsError) {
      console.error(listingsError);
    } else {
      setActiveListingsCount(listingsCount || 0);
    }

    if (followsError) {
      console.error(followsError);
    } else {
      setFollowerCount(followsCount || 0);
    }
  };

  const fetchProfile = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    let { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!data) {
      const { data: inserted, error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: user.email?.split("@")[0] || "user",
        })
        .select()
        .single();

      if (insertError) {
        console.error("PROFILE AUTO-CREATE ERROR:", insertError);
        setLoading(false);
        return;
      }

      data = inserted;
      error = null;
    }

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setProfile(data);
    setBreederName(data?.breeder_name || "");
    setBreederBio(data?.breeder_bio || "");

    if (data?.is_breeder) {
      await Promise.all([
        fetchMyAnnouncements(data.id),
        fetchBreederStats(data.id),
      ]);
    } else {
      setMyAnnouncements([]);
      setActiveListingsCount(0);
      setFollowerCount(0);
    }

    setLoading(false);
  };

  const handleBecomeBreeder = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("profiles")
      .update({
        is_breeder: true,
        breeder_name: breederName || profile?.username || "My Breeder Profile",
      })
      .eq("id", user.id)
      .select()
      .maybeSingle();

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Could not activate breeder profile.");
      return;
    }

    if (!data) {
      alert("No matching profile row found for this user.");
      return;
    }

    await fetchProfile();
  };

  const handleSaveBreederProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        breeder_name: breederName,
        breeder_bio: breederBio,
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Could not save breeder profile.");
      return;
    }

    setIsEditingProfile(false);
    await fetchProfile();
  };

  const handleStartEditingProfile = () => {
    setBreederName(profile?.breeder_name || "");
    setBreederBio(profile?.breeder_bio || "");
    setIsEditingProfile(true);
  };

  const handleCancelEditingProfile = () => {
    setBreederName(profile?.breeder_name || "");
    setBreederBio(profile?.breeder_bio || "");
    setIsEditingProfile(false);
  };

  const handleEditAnnouncement = (post: Announcement) => {
    setEditingAnnouncementId(post.id);
    setAnnouncementTitle(post.title || "");
    setAnnouncementContent(post.content || "");
    setAnnouncementType(post.post_type || "announcement");
    setExpectedDate(post.expected_date || "");
  };

  const handleCancelEditAnnouncement = () => {
    setEditingAnnouncementId(null);
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementType("announcement");
    setExpectedDate("");
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this announcement?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("breeder_announcements")
      .delete()
      .eq("id", announcementId);

    if (error) {
      console.error(error);
      alert("Could not delete announcement.");
      return;
    }

    if (profile?.id) {
      await fetchMyAnnouncements(profile.id);
    }

    if (editingAnnouncementId === announcementId) {
      handleCancelEditAnnouncement();
    }
  };

  const handleSaveAnnouncement = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !profile?.is_breeder) {
      alert("Only breeders can manage announcements.");
      return;
    }

    if (!announcementTitle.trim() || !announcementContent.trim()) {
      alert("Please add a title and content.");
      return;
    }

    setPostingAnnouncement(true);

    if (editingAnnouncementId) {
      const { error } = await supabase
        .from("breeder_announcements")
        .update({
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          post_type: announcementType,
          expected_date: expectedDate || null,
        })
        .eq("id", editingAnnouncementId)
        .eq("breeder_id", user.id);

      setPostingAnnouncement(false);

      if (error) {
        console.error(error);
        alert("Could not update announcement.");
        return;
      }

      handleCancelEditAnnouncement();
      await fetchMyAnnouncements(user.id);
      return;
    }

    const { data, error } = await supabase
      .from("breeder_announcements")
      .insert([
        {
          breeder_id: user.id,
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          post_type: announcementType,
          expected_date: expectedDate || null,
        },
      ])
      .select()
      .single();

    setPostingAnnouncement(false);

    if (error) {
      console.error(error);
      alert("Could not post announcement.");
      return;
    }

    const breederNameForNotification =
      profile.breeder_name || profile.username || "A breeder";

    await notifyBreederFollowersOfAnnouncement({
      breederId: user.id,
      breederName: breederNameForNotification,
      announcementId: data.id,
      title: data.title,
      postType: data.post_type,
    });

    handleCancelEditAnnouncement();
    await fetchMyAnnouncements(user.id);
  };

  const dashboardName =
    profile?.breeder_name || profile?.username || "Breeder";

  const profileStatus = useMemo(() => {
    if (!profile?.is_breeder) return "Not active";
    if (profile?.breeder_verified) return "Verified breeder";
    return "Breeder profile active";
  }, [profile]);

  const formatAnnouncementType = (postType: string) => {
    if (postType === "upcoming_litter") return "Upcoming Litter";
    if (postType === "available_soon") return "Available Soon";
    return "Announcement";
  };

  const formatShortDate = (date?: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <p>Loading breeder dashboard...</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10 pb-24">
      {!profile?.is_breeder ? (
        <>
          <div className="rounded-[32px] overflow-hidden border border-gray-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-[#07111f] via-[#102038] to-[#1b2e4a] px-6 sm:px-8 py-10 sm:py-12 text-white">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-medium text-white/90">
                  <Sparkles size={13} />
                  Premium breeder feature
                </div>

                <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">
                  Launch your breeder profile
                </h1>

                <p className="mt-4 text-sm sm:text-base text-white/75 leading-7 max-w-2xl">
                  Build a trusted breeder presence, grow followers, post upcoming
                  litters, and keep buyers updated long before listings go live.
                </p>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <Users size={18} className="text-green-600" />
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    Build followers
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Let buyers follow your breeder profile and stay connected.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <Megaphone size={18} className="text-green-600" />
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    Post updates
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Share upcoming litters, availability, and breeder news.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <Star size={18} className="text-green-600" />
                  <p className="mt-3 text-sm font-semibold text-gray-900">
                    Stand out
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Create a stronger public presence than a standard seller page.
                  </p>
                </div>
              </div>

              <div className="max-w-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breeder Name
                </label>
                <input
                  type="text"
                  value={breederName}
                  onChange={(e) => setBreederName(e.target.value)}
                  placeholder="Enter your breeder name"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                />

                <button
                  onClick={handleBecomeBreeder}
                  disabled={saving}
                  className="mt-5 rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition disabled:opacity-50"
                >
                  {saving ? "Activating..." : "Become a Breeder"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <section className="rounded-[32px] overflow-hidden border border-gray-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-[#07111f] via-[#102038] to-[#1b2e4a] px-6 sm:px-8 py-10 sm:py-12 text-white">
              <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/15 border border-white/10 flex items-center justify-center text-2xl font-bold">
                    {dashboardName?.charAt(0)?.toUpperCase() || "B"}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">
                        Breeder Dashboard
                      </h1>

                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 border border-green-400/20 px-3 py-1 text-xs font-medium text-green-200">
                        <Sparkles size={12} />
                        {profileStatus}
                      </span>

                      {profile?.breeder_verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-400/20 px-3 py-1 text-xs font-medium text-blue-200">
                          <BadgeCheck size={12} />
                          Verified
                        </span>
                      )}
                    </div>

                    <p className="mt-4 text-lg sm:text-xl font-semibold text-white">
                      {dashboardName}
                    </p>

                    <p className="mt-2 max-w-2xl text-sm sm:text-base text-white/75 leading-7">
                      {profile?.breeder_bio?.trim()
                        ? profile.breeder_bio
                        : "Build trust with buyers, publish breeder updates, and keep followers engaged with upcoming litters and availability."}
                    </p>

                    <p className="mt-3 text-sm text-white/60">
                      Followers are notified when you post updates and new breeder activity.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {profile?.id && (
                    <Link href={`/breeders/${profile.id}`}>
                      <button className="rounded-2xl bg-white text-gray-900 hover:bg-gray-100 px-5 py-3 text-sm font-semibold transition shadow-sm inline-flex items-center gap-2">
                        <Eye size={16} />
                        View Public Profile
                      </button>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      const element = document.getElementById("announcement-composer");
                      element?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md inline-flex items-center gap-2"
                  >
                    <Megaphone size={16} />
                    Post Update
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 sm:px-8 py-6">
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                    Followers
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {followerCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                    Active Listings
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {activeListingsCount}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                    Announcements
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {myAnnouncements.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {profile?.breeder_verified ? "Verified breeder" : "Breeder profile active"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.25fr] gap-6 mt-6">
            <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                    Profile
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    Breeder Identity
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Manage how your breeder profile appears publicly.
                  </p>
                </div>

                {!isEditingProfile ? (
                  <button
                    onClick={handleStartEditingProfile}
                    className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2.5 text-sm font-semibold transition inline-flex items-center gap-2"
                  >
                    <Pencil size={15} />
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleCancelEditingProfile}
                    className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2.5 text-sm font-semibold transition inline-flex items-center gap-2"
                  >
                    <X size={15} />
                    Cancel
                  </button>
                )}
              </div>

              {!isEditingProfile ? (
                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                      Breeder Name
                    </p>
                    <p className="mt-2 text-base font-semibold text-gray-900">
                      {profile?.breeder_name || "No breeder name added"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                      Breeder Bio
                    </p>
                    <p className="mt-2 text-sm text-gray-700 leading-7 whitespace-pre-line">
                      {profile?.breeder_bio?.trim()
                        ? profile.breeder_bio
                        : "No breeder bio added yet."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-4">
                    <p className="text-sm font-semibold text-gray-900">
                      Why this matters
                    </p>
                    <p className="mt-2 text-sm text-gray-600 leading-7">
                      A strong breeder profile helps build trust, improves follow rates,
                      and gives buyers a reason to come back before your next listing goes live.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Breeder Name
                    </label>
                    <input
                      type="text"
                      value={breederName}
                      onChange={(e) => setBreederName(e.target.value)}
                      placeholder="Breeder name"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Breeder Bio
                    </label>
                    <textarea
                      value={breederBio}
                      onChange={(e) => setBreederBio(e.target.value)}
                      placeholder="Tell buyers about your breeding program, experience, and what makes you different."
                      rows={6}
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleSaveBreederProfile}
                      disabled={saving}
                      className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition disabled:opacity-50 inline-flex items-center gap-2"
                    >
                      <Save size={16} />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEditingProfile}
                      className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section
              id="announcement-composer"
              className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                    Publishing
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    {editingAnnouncementId ? "Edit Announcement" : "Post an Announcement"}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Share upcoming litters, availability, or breeder updates with your followers.
                  </p>
                </div>

                <div className="rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-medium inline-flex items-center gap-1">
                  <Megaphone size={12} />
                  Followers notified
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Post Type
                  </label>
                  <select
                    value={announcementType}
                    onChange={(e) => setAnnouncementType(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="upcoming_litter">Upcoming Litter</option>
                    <option value="available_soon">Available Soon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expected Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  placeholder="e.g. Ragdoll litter expected in June"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  placeholder="Share the details your followers should know."
                  rows={6}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500 resize-none"
                />
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveAnnouncement}
                  disabled={postingAnnouncement}
                  className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition disabled:opacity-50"
                >
                  {postingAnnouncement
                    ? editingAnnouncementId
                      ? "Updating..."
                      : "Posting..."
                    : editingAnnouncementId
                    ? "Update Announcement"
                    : "Post Announcement"}
                </button>

                {editingAnnouncementId && (
                  <button
                    type="button"
                    onClick={handleCancelEditAnnouncement}
                    className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
            </section>
          </div>

          <section className="mt-6 bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                  Activity
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  Your Recent Announcements
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Manage your breeder updates and keep your profile fresh.
                </p>
              </div>
            </div>

            {myAnnouncements.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-gray-100 bg-gray-50 p-10 text-center">
                <p className="text-lg font-semibold text-gray-900">
                  No announcements yet
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Start posting updates so followers know what’s coming next.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {myAnnouncements.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                          {formatAnnouncementType(post.post_type)}
                        </span>

                        {post.expected_date && (
                          <span className="inline-flex text-xs bg-white text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
                            Expected: {formatShortDate(post.expected_date)}
                          </span>
                        )}

                        {post.created_at && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <CalendarDays size={12} />
                            {formatShortDate(post.created_at)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditAnnouncement(post)}
                          className="rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-3 py-2 text-xs font-semibold transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteAnnouncement(post.id)}
                          className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-xs font-semibold transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <p className="text-base font-semibold text-gray-900 mt-4">
                      {post.title}
                    </p>

                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-line leading-7">
                      {post.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {profile?.id && (
              <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                <Link href={`/breeders/${profile.id}`}>
                  <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition inline-flex items-center gap-2">
                    View Public Profile
                    <ArrowRight size={16} />
                  </button>
                </Link>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
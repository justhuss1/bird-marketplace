"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { notifyBreederFollowersOfAnnouncement } from "@/lib/breederAnnouncementNotifications";
import {
  UserCircle2,
  Save,
  Star,
  BadgeCheck,
  Megaphone,
  Pencil,
  X,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Heart,
  MessageCircle,
  Bell,
  Store,
  CalendarDays,
  ShieldCheck,
  PlusCircle,
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
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);

  const [username, setUsername] = useState("");
  const [breederName, setBreederName] = useState("");
  const [breederBio, setBreederBio] = useState("");

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("announcement");
  const [expectedDate, setExpectedDate] = useState("");
  const [myAnnouncements, setMyAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [breederEditOpen, setBreederEditOpen] = useState(false);

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
        console.error(insertError);
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

    setProfile(data as Profile);
    setUsername(data?.username || "");
    setBreederName(data?.breeder_name || "");
    setBreederBio(data?.breeder_bio || "");

    if (data?.is_breeder) {
      await fetchMyAnnouncements(data.id);
    } else {
      setMyAnnouncements([]);
    }

    setLoading(false);
  };

  const handleSaveBasicProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      return;
    }

    if (!username.trim()) {
      alert("Please enter a username.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Could not save profile.");
      return;
    }

    alert("Profile updated.");
    setProfileEditOpen(false);
    await fetchProfile();
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
        breeder_name: breederName.trim() || username.trim() || "My Breeder Profile",
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

    setBreederEditOpen(true);
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
        breeder_name: breederName.trim(),
        breeder_bio: breederBio.trim(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Could not save breeder profile.");
      return;
    }

    alert("Breeder profile updated.");
    setBreederEditOpen(false);
    await fetchProfile();
  };

  const resetAnnouncementForm = () => {
    setEditingAnnouncementId(null);
    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementType("announcement");
    setExpectedDate("");
  };

  const handleEditAnnouncement = (post: Announcement) => {
    setEditingAnnouncementId(post.id);
    setAnnouncementTitle(post.title || "");
    setAnnouncementContent(post.content || "");
    setAnnouncementType(post.post_type || "announcement");
    setExpectedDate(post.expected_date || "");
    setBreederEditOpen(true);
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
      resetAnnouncementForm();
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

      resetAnnouncementForm();
      await fetchMyAnnouncements(user.id);
      alert("Announcement updated.");
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

    resetAnnouncementForm();
    await fetchMyAnnouncements(user.id);
    alert("Announcement posted.");
  };

  const formatPostType = (postType: string) => {
    if (postType === "upcoming_litter") return "Upcoming Litter";
    if (postType === "available_soon") return "Available Soon";
    return "Announcement";
  };

  const formatLongDate = (date?: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return "Recently joined";
    return new Date(profile.created_at).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  }, [profile?.created_at]);

  const displayName = profile?.username || "User";
  const breederDisplayName =
    profile?.breeder_name || profile?.username || "Breeder";
  const announcementCount = myAnnouncements.length;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading account...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <p>Could not load account.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-4 py-6 sm:py-8 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* TOP HEADER */}
        <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 sm:px-8 py-5 sm:py-7">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-[24px] bg-green-50 border border-green-100 flex items-center justify-center text-2xl font-bold text-green-700 shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
                    My Account
                  </h1>

                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    <UserCircle2 size={12} />
                    {profile.is_breeder ? "Marketplace Account" : "Standard Account"}
                  </span>

                  {profile.is_breeder && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                      <Sparkles size={12} />
                      Breeder Active
                    </span>
                  )}

                  {profile.breeder_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      <BadgeCheck size={12} />
                      Verified
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm sm:text-base text-gray-500 leading-7 max-w-2xl">
                  Manage your profile, listings, messages, saved items, and breeder tools.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setProfileEditOpen((prev) => !prev)}
                className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 px-5 py-3 text-sm font-semibold transition inline-flex items-center justify-center gap-2"
              >
                <Pencil size={16} />
                {profileEditOpen ? "Close Profile Edit" : "Edit Profile"}
              </button>

              {profile.is_breeder ? (
                <button
                  onClick={() => setBreederEditOpen((prev) => !prev)}
                  className="rounded-2xl bg-[#111827] hover:bg-[#1b2433] text-white px-5 py-3 text-sm font-semibold transition inline-flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  {breederEditOpen ? "Close Breeder Tools" : "Open Breeder Tools"}
                </button>
              ) : (
                <button
                  onClick={handleBecomeBreeder}
                  disabled={saving}
                  className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Star size={16} />
                  {saving ? "Activating..." : "Become a Breeder"}
                </button>
              )}
            </div>
          </div>
        </section>


        {/* MAIN LAYOUT */}
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
          {/* LEFT RAIL */}
          <aside className="xl:sticky xl:top-24 space-y-6">
            <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-5">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Profile Snapshot
              </p>

              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                    Username
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {profile.username || "Not set"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                      Type
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {profile.is_breeder ? "Breeder" : "User"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                      Joined
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {memberSince}
                    </p>
                  </div>
                </div>

                {profile.is_breeder && (
                  <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 px-4 py-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <Store size={16} />
                      <p className="text-sm font-semibold">Breeder profile active</p>
                    </div>
                    <p className="mt-2 text-sm text-gray-600 leading-6">
                      Public breeder page, announcements, and follower notifications are enabled.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-5">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Quick Access
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link href="/my-listings">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition p-4 h-full">
                    <LayoutDashboard size={18} className="text-green-600" />
                    <p className="mt-3 text-sm font-semibold text-gray-900">My Listings</p>
                  </div>
                </Link>

                <Link href="/saved-listings">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition p-4 h-full">
                    <Heart size={18} className="text-green-600" />
                    <p className="mt-3 text-sm font-semibold text-gray-900">Saved</p>
                  </div>
                </Link>

                <Link href="/messages">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition p-4 h-full">
                    <MessageCircle size={18} className="text-green-600" />
                    <p className="mt-3 text-sm font-semibold text-gray-900">Messages</p>
                  </div>
                </Link>

                <Link href="/notifications">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition p-4 h-full">
                    <Bell size={18} className="text-green-600" />
                    <p className="mt-3 text-sm font-semibold text-gray-900">Alerts</p>
                  </div>
                </Link>
              </div>
            </section>

            {profile.is_breeder && (
              <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-5">
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                  Breeder Overview
                </p>

                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                      Breeder Name
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {breederDisplayName}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                      Announcements
                    </p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {announcementCount}
                    </p>
                  </div>

                  <Link href={`/breeders/${profile.id}`}>
                    <div className="rounded-2xl bg-[#111827] hover:bg-[#182131] transition text-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">View Public Profile</p>
                          <p className="text-xs text-white/65 mt-1">
                            See how buyers view your page
                          </p>
                        </div>
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </Link>
                </div>
              </section>
            )}
          </aside>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                    Marketplace
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    Your workspace
                  </h2>
                  <p className="mt-3 text-sm text-gray-500 max-w-2xl leading-7">
                    Jump into the areas you use most often without digging through menus.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
                <Link href="/my-listings">
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition p-5 h-full">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-green-600">
                      <LayoutDashboard size={18} />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">
                      My Listings
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 leading-6">
                      Manage your active ads, renew listings, and keep everything updated.
                    </p>
                  </div>
                </Link>

                <Link href="/saved-listings">
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition p-5 h-full">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-green-600">
                      <Heart size={18} />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">
                      Saved Listings
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 leading-6">
                      Revisit listings you want to watch or return to later.
                    </p>
                  </div>
                </Link>

                <Link href="/messages">
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition p-5 h-full">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-green-600">
                      <MessageCircle size={18} />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">
                      Messages
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 leading-6">
                      Continue chats with buyers and sellers in one place.
                    </p>
                  </div>
                </Link>

                <Link href="/notifications">
                  <div className="rounded-3xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md transition p-5 h-full">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-green-600">
                      <Bell size={18} />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-gray-900">
                      Notifications
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 leading-6">
                      Keep up with updates, follows, and marketplace activity.
                    </p>
                  </div>
                </Link>
              </div>
            </section>

            {profileEditOpen && (
              <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                      Basic Profile
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      Edit your profile
                    </h2>
                  </div>

                  <button
                    onClick={() => setProfileEditOpen(false)}
                    className="rounded-full p-2 hover:bg-gray-50"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>

                <div className="mt-6 max-w-2xl">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-500"
                  />

                  <div className="mt-5">
                    <button
                      onClick={handleSaveBasicProfile}
                      disabled={saving}
                      className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition inline-flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {saving ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {!profile.is_breeder && (
              <section className="rounded-[28px] border border-green-100 bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-sm p-6 sm:p-7">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-700">
                      Upgrade
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      Start your breeder profile
                    </h2>
                    <p className="mt-3 text-sm text-gray-600 leading-7">
                      Unlock breeder tools, announcements, upcoming litter posts, public breeder pages,
                      and follower notifications.
                    </p>
                  </div>

                  <button
                    onClick={handleBecomeBreeder}
                    disabled={saving}
                    className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <ArrowRight size={16} />
                    {saving ? "Activating..." : "Become a Breeder"}
                  </button>
                </div>
              </section>
            )}

            {profile.is_breeder && breederEditOpen && (
              <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                      Breeder Profile
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      Manage breeder identity
                    </h2>
                  </div>

                  <button
                    onClick={() => setBreederEditOpen(false)}
                    className="rounded-full p-2 hover:bg-gray-50"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
                  <div className="space-y-4">
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

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={handleSaveBreederProfile}
                        disabled={saving}
                        className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        <Save size={16} />
                        {saving ? "Saving..." : "Save Breeder Profile"}
                      </button>

                      <Link href={`/breeders/${profile.id}`}>
                        <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition">
                          View Public Breeder Profile
                        </button>
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-500">
                      Preview
                    </p>

                    <div className="mt-4 rounded-3xl bg-[#111827] text-white p-5">
                      <div className="w-12 h-12 rounded-2xl bg-white/12 flex items-center justify-center font-semibold text-lg">
                        {(breederName || breederDisplayName).charAt(0).toUpperCase()}
                      </div>

                      <p className="mt-4 text-lg font-semibold">
                        {breederName || breederDisplayName}
                      </p>

                      <p className="mt-2 text-sm text-white/70 leading-6">
                        {breederBio || "Your breeder bio preview will appear here."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {profile.is_breeder && (
              <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                      Announcements
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      {editingAnnouncementId ? "Edit announcement" : "Post an announcement"}
                    </h2>
                    <p className="mt-3 text-sm text-gray-500 leading-7 max-w-2xl">
                      Share upcoming litters, breeder updates, and availability with your followers.
                    </p>
                  </div>

                  {!editingAnnouncementId && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 px-3 py-2 text-xs font-medium">
                      <PlusCircle size={14} />
                      New update
                    </div>
                  )}
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
                    placeholder="e.g. Cavoodle litter expected in June"
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
                    className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <Megaphone size={16} />
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
                      onClick={resetAnnouncementForm}
                      className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition"
                    >
                      Cancel Editing
                    </button>
                  )}
                </div>
              </section>
            )}

            {profile.is_breeder && myAnnouncements.length > 0 && (
              <section className="rounded-[28px] border border-gray-200 bg-white shadow-sm p-6 sm:p-7">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                    Your Posts
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    Recent announcements
                  </h2>
                </div>

                <div className="mt-6 space-y-4">
                  {myAnnouncements.map((post) => (
                    <article
                      key={post.id}
                      className="rounded-3xl border border-gray-100 bg-gray-50 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                            {formatPostType(post.post_type)}
                          </span>

                          {post.expected_date && (
                            <span className="inline-flex text-xs bg-white text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
                              Expected: {formatLongDate(post.expected_date)}
                            </span>
                          )}

                          {post.created_at && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <CalendarDays size={12} />
                              {formatLongDate(post.created_at)}
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

                      <p className="text-sm text-gray-600 mt-3 whitespace-pre-line leading-7">
                        {post.content}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

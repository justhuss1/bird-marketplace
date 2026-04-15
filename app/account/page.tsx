"use client";

import { useEffect, useState } from "react";
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

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <p>Loading account...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <p>Could not load account.</p>
      </main>
    );
  }

  const displayName = profile.username || "User";

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 pb-24">
      <section className="overflow-hidden rounded-[32px] border border-gray-100 shadow-sm bg-white">
        <div className="bg-gradient-to-r from-[#07111f] via-[#102038] to-[#1b2e4a] px-6 sm:px-8 py-10 sm:py-12 text-white">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/15 border border-white/10 backdrop-blur flex items-center justify-center text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                    My Account
                  </h1>

                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-medium text-white/80">
                    <UserCircle2 size={12} />
                    Standard Profile
                  </span>

                  {profile.is_breeder && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 border border-green-400/20 px-3 py-1 text-xs font-medium text-green-200">
                      <Star size={12} />
                      Breeder Active
                    </span>
                  )}

                  {profile.breeder_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-400/20 px-3 py-1 text-xs font-medium text-blue-200">
                      <BadgeCheck size={12} />
                      Verified
                    </span>
                  )}
                </div>

                <p className="mt-3 max-w-2xl text-sm sm:text-base text-white/75 leading-7">
                  Manage your profile, listings, saved items, and breeder tools in one place.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setProfileEditOpen((prev) => !prev)}
                className="rounded-2xl bg-white text-gray-900 hover:bg-gray-100 px-5 py-3 text-sm font-semibold transition shadow-md inline-flex items-center gap-2"
              >
                <Pencil size={16} />
                {profileEditOpen ? "Close Profile Edit" : "Edit Profile"}
              </button>

              {profile.is_breeder ? (
                <button
                  onClick={() => setBreederEditOpen((prev) => !prev)}
                  className="rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 text-white px-5 py-3 text-sm font-semibold transition inline-flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  {breederEditOpen ? "Close Breeder Tools" : "Open Breeder Tools"}
                </button>
              ) : (
                <button
                  onClick={handleBecomeBreeder}
                  disabled={saving}
                  className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <Star size={16} />
                  {saving ? "Activating..." : "Become a Breeder"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-6 bg-white">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-gray-50 px-4 py-4 border border-gray-100">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                Username
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {profile.username || "Not set"}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-4 border border-gray-100">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                Profile Type
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {profile.is_breeder ? "Breeder" : "Standard User"}
              </p>
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-4 border border-gray-100">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                Breeder Access
              </p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {profile.is_breeder ? "Enabled" : "Available"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {profileEditOpen && (
        <section className="mt-8 bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Profile
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Edit Basic Profile
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
        <section className="mt-8 bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Upgrade
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Start your breeder profile
              </h2>
              <p className="mt-3 text-sm text-gray-600 leading-7">
                Unlock breeder tools, announcements, upcoming litter posts, public breeder pages, and follower notifications.
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

      {profile.is_breeder && (
        <>
          {breederEditOpen && (
            <section className="mt-8 bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                    Breeder Profile
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-900">
                    Manage Breeder Profile
                  </h2>
                </div>

                <button
                  onClick={() => setBreederEditOpen(false)}
                  className="rounded-full p-2 hover:bg-gray-50"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              <div className="mt-6 max-w-3xl space-y-4">
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
                    rows={5}
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
            </section>
          )}

          <section className="mt-8 bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 sm:p-7">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Announcements
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {editingAnnouncementId ? "Edit Announcement" : "Post an Announcement"}
              </h2>
              <p className="mt-3 text-sm text-gray-500">
                Share upcoming litters, breeder updates, and availability with your followers.
              </p>
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
                rows={5}
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

          {myAnnouncements.length > 0 && (
            <section className="mt-8 bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 sm:p-7">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                  Your Posts
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  Recent Announcements
                </h2>
              </div>

              <div className="mt-6 space-y-3">
                {myAnnouncements.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                          {formatPostType(post.post_type)}
                        </span>

                        {post.expected_date && (
                          <span className="inline-flex text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                            Expected: {new Date(post.expected_date).toLocaleDateString()}
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

                    <p className="text-sm font-semibold text-gray-900 mt-3">
                      {post.title}
                    </p>

                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
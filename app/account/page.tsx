"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { notifyBreederFollowersOfAnnouncement } from "@/lib/breederAnnouncementNotifications";

type Profile = {
  id: string;
  username?: string | null;
  is_breeder?: boolean | null;
  breeder_name?: string | null;
  breeder_bio?: string | null;
  breeder_verified?: boolean | null;
  created_at?: string | null;
};

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [breederName, setBreederName] = useState("");
  const [breederBio, setBreederBio] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [announcementType, setAnnouncementType] = useState("announcement");
  const [expectedDate, setExpectedDate] = useState("");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [myAnnouncements, setMyAnnouncements] = useState<any[]>([]);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

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

    setMyAnnouncements(data || []);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    console.log("FETCH PROFILE AUTH USER ID:", user?.id);

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

    console.log("FETCH PROFILE RESULT:", { data, error });

    if (error) {
        console.error(error);
        setLoading(false);
        return;
    }

    setProfile(data);
    setBreederName(data?.breeder_name || "");
    setBreederBio(data?.breeder_bio || "");

    if (data?.is_breeder) {
      await fetchMyAnnouncements(data.id);
    } else {
      setMyAnnouncements([]);
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

    console.log("BECOME BREEDER RESULT:", { data, error, userId: user.id });

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

    alert("Breeder profile updated.");
    await fetchProfile();
  };

  const handlePostAnnouncement = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !profile?.is_breeder) {
      alert("Only breeders can post announcements.");
      return;
    }

    if (!announcementTitle.trim() || !announcementContent.trim()) {
      alert("Please add a title and content.");
      return;
    }

    setPostingAnnouncement(true);

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

    setAnnouncementTitle("");
    setAnnouncementContent("");
    setAnnouncementType("announcement");
    setExpectedDate("");

    await fetchMyAnnouncements(user.id);
    alert("Announcement posted.");
  };

  const handleEditAnnouncement = (post: any) => {
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

  handleCancelEditAnnouncement();
  await fetchMyAnnouncements(user.id);
  alert("Announcement posted.");
};

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-8">
        <p>Loading account...</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Account</h1>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900">Breeder Profile</h2>

        {!profile?.is_breeder ? (
          <>
            <p className="text-sm text-gray-500 mt-2">
              Upgrade your account to create a breeder profile and let users follow you.
            </p>

            <div className="mt-4 space-y-4">
              <div>
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
              </div>

              <button
                onClick={handleBecomeBreeder}
                disabled={saving}
                className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition disabled:opacity-50"
              >
                {saving ? "Activating..." : "Become a Breeder"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                Breeder Profile Active
              </span>

              {profile?.breeder_verified && (
                <span className="inline-flex text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                  Verified Breeder
                </span>
              )}
            </div>

            <div className="mt-5 space-y-4">
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
                  className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Breeder Profile"}
                </button>

                {profile?.id && (
                  <Link href={`/breeders/${profile.id}`}>
                    <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition">
                      View Public Breeder Profile
                    </button>
                  </Link>
                )}
              </div>
            </div>
            <div className="mt-8 border-t border-gray-100 pt-8">
              <h3 className="text-lg font-semibold text-gray-900">
                Post an Announcement
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Share upcoming litters, availability, or breeder updates with your followers.
              </p>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {myAnnouncements.length > 0 && (
              <div className="mt-8 border-t border-gray-100 pt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Recent Announcements
                </h3>

                <div className="space-y-3">
                  {myAnnouncements.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">

                        {/* LEFT SIDE */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                            {post.post_type === "upcoming_litter"
                              ? "Upcoming Litter"
                              : post.post_type === "available_soon"
                              ? "Available Soon"
                              : "Announcement"}
                          </span>

                          {post.expected_date && (
                            <span className="inline-flex text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                              Expected:{" "}
                              {new Date(post.expected_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* RIGHT SIDE */}
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

                      {/* CONTENT */}
                      <p className="text-sm font-semibold text-gray-900 mt-3">
                        {post.title}
                      </p>

                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
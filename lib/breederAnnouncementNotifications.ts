import { supabase } from "@/lib/supabase";

type NotifyFollowersInput = {
  breederId: string;
  breederName: string;
  announcementId: string;
  title: string;
  postType: string;
};

export async function notifyBreederFollowersOfAnnouncement({
  breederId,
  breederName,
  announcementId,
  title,
  postType,
}: NotifyFollowersInput) {
  const { data: followers, error: followersError } = await supabase
    .from("follows")
    .select("user_id")
    .eq("breeder_id", breederId);

  if (followersError) {
    console.error("Failed to fetch breeder followers:", followersError);
    return;
  }

  if (!followers || followers.length === 0) return;

  const typeLabel =
    postType === "upcoming_litter"
      ? "Upcoming litter"
      : postType === "available_soon"
      ? "Available soon"
      : "Breeder update";

  const notifications = followers.map((follow) => ({
    user_id: follow.user_id,
    type: "breeder_announcement",
    title: typeLabel,
    message: `New from ${breederName}: ${title}`,
    link: `/breeders/${breederId}`,
    is_read: false,
  }));

  const { error: insertError } = await supabase
    .from("notifications")
    .insert(notifications);

  if (insertError) {
    console.error("Failed to create breeder announcement notifications:", insertError);
  }
}
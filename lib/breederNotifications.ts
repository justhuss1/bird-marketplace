import { supabase } from "@/lib/supabase";

type NotifyFollowersInput = {
  breederId: string;
  breederName: string;
  listingId: string;
  listingTitle: string;
};

export async function notifyBreederFollowersOfNewListing({
  breederId,
  breederName,
  listingId,
  listingTitle,
}: NotifyFollowersInput) {
  const { data: followers, error: followersError } = await supabase
    .from("follows")
    .select("user_id")
    .eq("breeder_id", breederId);

  if (followersError) {
    console.error("Failed to fetch breeder followers:", followersError);
    return;
  }

  if (!followers || followers.length === 0) {
    return;
  }

  const notifications = followers.map((follow) => ({
    user_id: follow.user_id,
    type: "breeder_listing",
    title: "New breeder listing",
    message: `${breederName} has posted a new listing: ${listingTitle}`,
    link: `/listing/${listingId}`,
    is_read: false,
  }));

  const { error: notificationError } = await supabase
    .from("notifications")
    .insert(notifications);

  if (notificationError) {
    console.error("Failed to create breeder notifications:", notificationError);
  }
}
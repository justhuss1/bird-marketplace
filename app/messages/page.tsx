"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Conversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  listings?: {
    title: string;
    image: string | null;
    location: string;
  };
};

type LatestMessageMap = {
  [conversationId: string]: string;
};

export default function MessagesInboxPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [latestMessages, setLatestMessages] = useState<LatestMessageMap>({});

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        listings (
          title,
          image,
          location
        )
      `
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const inboxData = (data || []) as Conversation[];
    setConversations(inboxData);

    const previews: LatestMessageMap = {};

    for (const convo of inboxData) {
      const { data: messageData } = await supabase
        .from("messages")
        .select("text")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      previews[convo.id] = messageData?.text || "No messages yet";
    }

    setLatestMessages(previews);
    setLoading(false);
  };

  if (loading) {
    return <main className="p-4">Loading messages...</main>;
  }

  return (
    <main className="bg-gray-50 min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-black transition"
        >
          ← Back
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">
            View your buyer and seller conversations.
          </p>
        </div>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <div className="text-4xl mb-3">💬</div>
            <h2 className="text-xl font-semibold text-gray-800">
              No conversations yet
            </h2>
            <p className="text-gray-500 mt-2">
              When you message a seller, your conversations will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <Link key={conversation.id} href={`/messages/${conversation.id}`}>
                <div className="bg-white rounded-2xl shadow hover:shadow-md transition p-4 cursor-pointer">
                  <div className="flex gap-4 items-center">
                    <img
                      src={
                        conversation.listings?.image &&
                        conversation.listings.image !== ""
                          ? conversation.listings.image
                          : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600"
                      }
                      alt={conversation.listings?.title || "Listing"}
                      className="w-24 h-24 rounded-xl object-cover"
                    />

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 truncate">
                        {conversation.listings?.title || "Untitled Listing"}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        📍{" "}
                        {conversation.listings?.location ||
                          "Unknown location"}
                      </p>

                      <p className="text-sm text-gray-600 mt-2 truncate">
                        {latestMessages[conversation.id]}
                      </p>
                    </div>

                    <div className="text-sm text-green-600 font-medium">
                      Open →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
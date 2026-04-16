"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  MapPin,
  MessageCircle,
  ChevronRight,
  Search,
  Image as ImageIcon,
  FileText,
} from "lucide-react";

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

type LatestMessagePreview = {
  text: string;
  type?: string | null;
  attachment_name?: string | null;
  attachment_mime_type?: string | null;
};

type LatestMessageMap = {
  [conversationId: string]: LatestMessagePreview;
};

export default function MessagesInboxPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [latestMessages, setLatestMessages] = useState<LatestMessageMap>({});
  const [searchTerm, setSearchTerm] = useState("");

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
        .select("text, message_type, attachment_name, attachment_mime_type")
        .eq("conversation_id", convo.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      previews[convo.id] = {
        text: messageData?.text || "",
        type: messageData?.message_type || "text",
        attachment_name: messageData?.attachment_name || null,
        attachment_mime_type: messageData?.attachment_mime_type || null,
      };
    }

    setLatestMessages(previews);
    setLoading(false);
  };

  const getPreviewText = (conversationId: string) => {
    const preview = latestMessages[conversationId];

    if (!preview) return "No messages yet";

    const hasText = !!preview.text?.trim();
    const isImage =
      preview.type === "image" ||
      (!!preview.attachment_mime_type &&
        preview.attachment_mime_type.startsWith("image/"));
    const isFile =
      preview.type === "file" ||
      (!!preview.attachment_name && !isImage);

    if (hasText) return preview.text;

    if (isImage) return "Photo";
    if (isFile) return preview.attachment_name || "File";

    return "No messages yet";
  };

  const getPreviewIcon = (conversationId: string) => {
    const preview = latestMessages[conversationId];

    if (!preview) return null;

    const hasText = !!preview.text?.trim();
    const isImage =
      preview.type === "image" ||
      (!!preview.attachment_mime_type &&
        preview.attachment_mime_type.startsWith("image/"));
    const isFile =
      preview.type === "file" ||
      (!!preview.attachment_name && !isImage);

    if (hasText) return null;
    if (isImage) return <ImageIcon size={14} className="shrink-0" />;
    if (isFile) return <FileText size={14} className="shrink-0" />;

    return null;
  };

  const filteredConversations = conversations.filter((conversation) => {
    const title = conversation.listings?.title?.toLowerCase() || "";
    const location = conversation.listings?.location?.toLowerCase() || "";
    const preview = getPreviewText(conversation.id).toLowerCase();
    const query = searchTerm.toLowerCase();

    return (
      title.includes(query) ||
      location.includes(query) ||
      preview.includes(query)
    );
  });

  if (loading) {
    return <main className="p-4">Loading messages...</main>;
  }

  return (
    <main className="bg-gray-50 min-h-screen py-6 sm:py-8 px-4 pb-24">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-black transition"
        >
          ← Back
        </button>

        <div className="mb-6">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
            Inbox
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-2">
            View your buyer and seller conversations for pets and listings in one place.
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-4 sm:p-5 mb-6">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        {filteredConversations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
              <MessageCircle size={26} />
            </div>

            <h2 className="text-xl font-semibold text-gray-800">
              {conversations.length === 0
                ? "No conversations yet"
                : "No matching conversations"}
            </h2>

            <p className="text-gray-500 mt-2 max-w-md mx-auto">
              {conversations.length === 0
                ? "When you message a seller about a pet or listing, your conversations will appear here."
                : "Try searching for a listing title, location, or message preview."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <Link key={conversation.id} href={`/messages/${conversation.id}`}>
                <article className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition duration-300 p-4 sm:p-5 cursor-pointer">
                  <div className="flex gap-4 items-center">
                    <div className="shrink-0">
                      <img
                        src={
                          conversation.listings?.image &&
                          conversation.listings.image !== ""
                            ? conversation.listings.image
                            : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600"
                        }
                        alt={conversation.listings?.title || "Listing"}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-semibold text-gray-900 line-clamp-1">
                          {conversation.listings?.title || "Untitled Listing"}
                        </h2>

                        <div className="hidden sm:flex items-center gap-1 text-sm text-gray-400 shrink-0">
                          <span>Open</span>
                          <ChevronRight size={16} />
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin size={14} />
                        {conversation.listings?.location || "Unknown location"}
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 line-clamp-2">
                        {getPreviewIcon(conversation.id)}
                        <span className="line-clamp-2">
                          {getPreviewText(conversation.id)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, MapPin, Send } from "lucide-react";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

type Listing = {
  title: string;
  image: string | null;
  location: string;
};

type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  listings?: Listing;
};

export default function MessagesThreadPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchThread();
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchThread = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);

    const { data: conversationData, error: conversationError } = await supabase
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
      .eq("id", conversationId)
      .single();

    if (conversationError) {
      console.error(conversationError);
      setLoading(false);
      return;
    }

    setConversation(conversationData as Conversation);

    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (messageError) {
      console.error(messageError);
      setLoading(false);
      return;
    }

    setMessages((messageData || []) as Message[]);

    const channel = supabase
      .channel(`messages-thread-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;

          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === incoming.id);
            if (exists) return prev;
            return [...prev, incoming];
          });
        }
      )
      .subscribe();

    setLoading(false);

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (!conversation) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const messageText = newMessage.trim();

    const { error } = await supabase.from("messages").insert([
      {
        conversation_id: conversation.id,
        sender_id: user.id,
        text: messageText,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Failed to send message");
      return;
    }

    setNewMessage("");

    const recipientId =
      conversation.buyer_id === user.id
        ? conversation.seller_id
        : conversation.buyer_id;

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: recipientId,
          type: "message",
          title: "New message",
          message: messageText,
          link: `/messages/${conversation.id}`,
          is_read: false,
        },
      ]);

    if (notificationError) {
      console.error("Notification insert error:", notificationError);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <main className="p-4">Loading conversation...</main>;
  }

  if (!conversation) {
    return (
      <main className="bg-gray-50 min-h-screen py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-4 text-sm text-gray-600 hover:text-black transition"
          >
            ← Back
          </button>
          <p>Conversation not found.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen px-4 py-6 pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => router.push("/messages")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
          >
            <ArrowLeft size={16} />
            Back to messages
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-100 p-4 sm:p-5 bg-white">
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                <img
                  src={
                    conversation.listings?.image &&
                    conversation.listings.image !== ""
                      ? conversation.listings.image
                      : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600"
                  }
                  alt={conversation.listings?.title || "Listing"}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/listing/${conversation.listing_id}`}
                  className="text-lg font-semibold text-gray-900 hover:text-green-600 transition"
                >
                  {conversation.listings?.title || "Untitled Listing"}
                </Link>

                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin size={14} />
                  {conversation.listings?.location || "Unknown location"}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-gray-50 px-4 sm:px-5 py-5 h-[60vh] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                    <Send size={24} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Start the conversation
                  </h2>
                  <p className="text-sm text-gray-500 mt-2">
                    Ask about availability, pickup, price, or any details about
                    this listing.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const isOwnMessage = message.sender_id === userId;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[70%] rounded-3xl px-4 py-3 shadow-sm ${
                          isOwnMessage
                            ? "bg-green-600 text-white rounded-br-md"
                            : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm leading-6 break-words">
                          {message.text}
                        </p>
                        <p
                          className={`mt-2 text-[11px] ${
                            isOwnMessage ? "text-white/70" : "text-gray-400"
                          }`}
                        >
                          {formatMessageTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-4 bg-white">
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-500 focus:bg-white"
              />

              <button
                onClick={handleSend}
                className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-4 py-3 transition shadow-md"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
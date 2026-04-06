"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

type Conversation = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
};

export default function MessagesPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserId(user.id);
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setMessages((data || []) as Message[]);
    }
  };

  const fetchConversation = async () => {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error(error);
    } else {
      setConversation(data as Conversation);
    }
  };

  useEffect(() => {
    if (!conversationId || !userId) return;

    fetchMessages();
    fetchConversation();

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            const alreadyExists = prev.some((msg) => msg.id === newMsg.id);
            if (alreadyExists) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const messageText = newMessage;

    const { error } = await supabase.from("messages").insert([
      {
        conversation_id: conversationId,
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

    if (conversation) {
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
            link: `/messages/${conversationId}`,
            is_read: false,
          },
        ]);

      if (notificationError) {
        console.error("Notification insert error:", notificationError);
      }
          }
        };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <main className="p-4">Loading chat...</main>;
  }

  return (
    <main className="bg-gray-50 min-h-screen py-8 px-4 pb-24">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-black transition"
        >
          ← Back
        </button>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="border-b px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time conversation
            </p>
          </div>

          <div className="p-4 h-[500px] overflow-y-auto bg-gray-50 space-y-4">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No messages yet. Start the conversation.
              </p>
            ) : (
              messages.map((message) => {
                const isMine = message.sender_id === userId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                        isMine
                          ? "bg-green-600 text-white"
                          : "bg-white border text-gray-800"
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p
                        className={`text-[11px] mt-2 ${
                          isMine ? "text-green-100" : "text-gray-400"
                        }`}
                      >
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="border-t p-4 flex gap-2 bg-white">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-black outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-xl font-medium transition"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
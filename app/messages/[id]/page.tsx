"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
};

export default function MessagesPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params?.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (conversationId && userId) {
      fetchMessages();
    }
  }, [conversationId, userId]);

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
      setMessages(data || []);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    const { error } = await supabase.from("messages").insert([
      {
        conversation_id: conversationId,
        sender_id: userId,
        text: newMessage,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Failed to send message");
      return;
    }

    setNewMessage("");
    fetchMessages();
  };

  if (loading) {
    return <main className="p-4">Loading chat...</main>;
  }

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>

      <div className="bg-white border rounded-lg p-4 h-[400px] overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg max-w-[80%] ${
                message.sender_id === userId
                  ? "bg-green-600 text-white ml-auto"
                  : "bg-gray-200 text-black"
              }`}
            >
              {message.text}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-black outline-none"
            autoFocus
        />
        <button
            type="submit"
            className="bg-green-600 text-white px-4 rounded-lg"
        >
            Send
        </button>
        </form>
    </main>
  );
}
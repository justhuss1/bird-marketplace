"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import FormMessage from "@/components/FormMessage";
import {
  ArrowLeft,
  MapPin,
  Send,
  Paperclip,
  FileText,
  X,
} from "lucide-react";

type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  message_type?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_mime_type?: string | null;
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
  const [sending, setSending] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [userId, setUserId] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const init = async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (!isMounted) return;

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

      if (conversationError || !conversationData) {
        console.error(conversationError);
        if (isMounted) {
          setConversation(null);
          setLoading(false);
        }
        return;
      }

      if (
        conversationData.buyer_id !== user.id &&
        conversationData.seller_id !== user.id
      ) {
        setFormError("You do not have access to this conversation.");
        router.push("/messages");
        return;
      }

      if (!isMounted) return;

      setConversation(conversationData as Conversation);

      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (messageError) {
        console.error(messageError);
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      if (!isMounted) return;

      setMessages((messageData || []) as Message[]);
      setLoading(false);

      channel = supabase
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
    };

    init();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError("");
    setFormSuccess("");

    const file = e.target.files?.[0] || null;

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const maxSizeMb = 10;
    const fileSizeMb = file.size / 1024 / 1024;

    if (fileSizeMb > maxSizeMb) {
      setSelectedFile(null);
      setFormError(`File is too large. Please choose a file under ${maxSizeMb} MB.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    setFormSuccess("Attachment added.");
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFormError("");
    setFormSuccess("Attachment removed");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadAttachment = async (file: File, currentUserId: string) => {
    const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
    const filePath = `${currentUserId}/${conversationId}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("message-attachments")
      .upload(filePath, file, {
        upsert: false,
      });

    if (uploadError) {
      console.error("SUPABASE STORAGE UPLOAD ERROR:", uploadError);
      throw uploadError;
    }

    const { data: publicData } = supabase.storage
      .from("message-attachments")
      .getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
    };
  };

  const handleSend = async () => {
    setFormError("");
    setFormSuccess("");

    if ((!newMessage.trim() && !selectedFile) || !conversation || sending) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFormError("Please log in to send messages.");
      router.push("/login");
      return;
    }

    setSending(true);

    try {
      let attachmentUrl: string | null = null;
      let attachmentName: string | null = null;
      let attachmentMimeType: string | null = null;
      let messageType = "text";

      if (selectedFile) {
        setUploadingAttachment(true);

        const uploaded = await uploadAttachment(selectedFile, user.id);

        attachmentUrl = uploaded.url;
        attachmentName = uploaded.name;
        attachmentMimeType = uploaded.mimeType;

        if (attachmentMimeType.startsWith("image/")) {
          messageType = "image";
        } else {
          messageType = "file";
        }
      }

      const messageText = newMessage.trim();

      const { error: messageError } = await supabase.from("messages").insert([
        {
          conversation_id: conversation.id,
          sender_id: user.id,
          text: messageText,
          message_type: messageType,
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
          attachment_mime_type: attachmentMimeType,
        },
      ]);

      if (messageError) {
        console.error(messageError);
        setFormError("Failed to send message.");
        setSending(false);
        setUploadingAttachment(false);
        return;
      }

      setNewMessage("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      const recipientId =
        conversation.buyer_id === user.id
          ? conversation.seller_id
          : conversation.buyer_id;

      const notificationMessage = `You have a new message about ${
        conversation.listings?.title || "a listing"
      }.`;

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: recipientId,
            type: "message",
            title: "New message",
            message: notificationMessage,
            link: `/messages/${conversation.id}`,
            is_read: false,
          },
        ]);

      if (notificationError) {
        console.error("Notification insert error:", notificationError);
      }

      setFormSuccess("Message sent.");
    } catch (error) {
      console.error(error);
      setFormError(
        "Failed to upload attachment or send message. Please try again."
      );
    }

    setSending(false);
    setUploadingAttachment(false);
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

  const isImageMessage = (message: Message) => {
    return (
      message.message_type === "image" ||
      (!!message.attachment_mime_type &&
        message.attachment_mime_type.startsWith("image/"))
    );
  };

  if (loading) {
    return <main className="p-4">Loading conversation...</main>;
  }

  if (!conversation) {
    return (
      <main className="bg-[#f7f7f5] min-h-screen px-4 py-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.push("/messages")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
          >
            <ArrowLeft size={16} />
            Back to messages
          </button>

          <div className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Conversation not found
            </h2>
            <p className="text-gray-500 mt-2">
              This conversation may have been removed or is no longer available.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#f7f7f5] min-h-screen px-4 py-6 pb-24">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/messages")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={16} />
          Back to messages
        </button>

        <div className="mt-4 grid grid-cols-1 gap-4">
          {/* HEADER */}
          <section className="bg-white border border-gray-100 rounded-[28px] shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5">
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
                    className="text-lg font-semibold text-gray-900 hover:text-green-600 transition line-clamp-1"
                  >
                    {conversation.listings?.title || "Untitled Listing"}
                  </Link>

                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                    <MapPin size={14} />
                    <span className="truncate">
                      {conversation.listings?.location || "Unknown location"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* THREAD */}
          <section className="bg-white border border-gray-100 rounded-[28px] shadow-sm overflow-hidden">
            <div className="bg-[#f9fafb] px-4 sm:px-5 py-5 h-[58vh] sm:h-[62vh] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-sm">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                      <Send size={24} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Start the conversation
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 leading-7">
                      Ask about availability, pickup, price, or any details about
                      this pet or listing.
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
                          className={`max-w-[86%] sm:max-w-[72%] rounded-[24px] px-4 py-3 shadow-sm ${
                            isOwnMessage
                              ? "bg-green-600 text-white rounded-br-md"
                              : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                          }`}
                        >
                          {!!message.text && (
                            <p className="text-sm leading-6 break-words">
                              {message.text}
                            </p>
                          )}

                          {message.attachment_url && isImageMessage(message) && (
                            <div className={message.text ? "mt-3" : ""}>
                              <a
                                href={message.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={message.attachment_url}
                                  alt={message.attachment_name || "Attachment"}
                                  className="max-w-full w-[220px] sm:w-[280px] rounded-2xl object-cover border border-white/10"
                                />
                              </a>
                            </div>
                          )}

                          {message.attachment_url && !isImageMessage(message) && (
                            <div
                              className={`rounded-2xl px-3 py-3 ${
                                message.text ? "mt-3" : ""
                              } ${
                                isOwnMessage
                                  ? "bg-white/10"
                                  : "bg-gray-50 border border-gray-100"
                              }`}
                            >
                              <a
                                href={message.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3"
                              >
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    isOwnMessage
                                      ? "bg-white/10 text-white"
                                      : "bg-white text-gray-700 border border-gray-200"
                                  }`}
                                >
                                  <FileText size={18} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {message.attachment_name || "Attachment"}
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      isOwnMessage
                                        ? "text-white/70"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    Open file
                                  </p>
                                </div>
                              </a>
                            </div>
                          )}

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

            {/* COMPOSER */}
            <div className="border-t border-gray-100 bg-white p-4">
              {(formError || formSuccess) && (
                <div className="mb-3">
                  <FormMessage
                    type={formError ? "error" : "success"}
                    message={formError || formSuccess}
                  />
                </div>
              )}
              
              {selectedFile && (
                <div className="mb-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {selectedFile.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="w-14 h-14 rounded-xl object-cover border"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white border flex items-center justify-center">
                        <FileText size={18} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={clearSelectedFile}
                    className="rounded-full p-2 hover:bg-gray-100 transition"
                  >
                    <X size={16} className="text-gray-500" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx,.txt"
                  onChange={handleFileSelected}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={openFilePicker}
                  className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 transition shrink-0"
                >
                  <Paperclip size={18} />
                </button>

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
                  disabled={
                    sending ||
                    uploadingAttachment ||
                    (!newMessage.trim() && !selectedFile)
                  }
                  className="rounded-2xl bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 transition shadow-sm shrink-0 inline-flex items-center gap-2"
                >
                  <Send size={18} />
                  <span className="hidden sm:inline">
                    {uploadingAttachment ? "Uploading..." : sending ? "Sending..." : "Send"}
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
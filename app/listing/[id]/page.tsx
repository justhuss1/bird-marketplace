"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [listing, setListing] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id]);

  const fetchListing = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("ERROR:", error);
    } else {
      setListing(data);
    }
  };

  const handleMessageSeller = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in to message the seller.");
      router.push("/login");
      return;
    }

    if (user.id === listing.user_id) {
      alert("This is your own listing.");
      return;
    }

    const { data: existingConversation, error: existingError } = await supabase
      .from("conversations")
      .select("*")
      .eq("listing_id", listing.id)
      .eq("buyer_id", user.id)
      .eq("seller_id", listing.user_id)
      .maybeSingle();

    if (existingError) {
      console.error(existingError);
      alert("Could not open conversation");
      return;
    }

    if (existingConversation) {
      router.push(`/messages/${existingConversation.id}`);
      return;
    }

    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert([
        {
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.user_id,
        },
      ])
      .select()
      .single();

    if (createError) {
      console.error(createError);
      alert("Could not create conversation");
      return;
    }

    router.push(`/messages/${newConversation.id}`);
  };

  if (!listing) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <main className="p-4">
      <img
        src={
          listing.image || "https://via.placeholder.com/600x400?text=No+Image"
        }
        className="w-full h-64 object-cover rounded-lg"
        alt={listing.title}
      />

      <h1 className="text-2xl font-bold mt-4">{listing.title}</h1>

      <p className="text-green-600 text-xl font-bold">{listing.price}</p>

      <p className="text-gray-500 mt-1">{listing.location}</p>

      <p className="mt-4">{listing.description}</p>

      <button
        onClick={handleMessageSeller}
        className="mt-6 w-full bg-green-600 text-white p-3 rounded-lg"
      >
        Message Seller
      </button>
    </main>
  );
}
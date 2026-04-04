"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (id && !checkingAuth) {
      fetchListing();
    }
  }, [id, checkingAuth]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setCheckingAuth(false);
  };

  const fetchListing = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    router.push("/login");
    return;
  }

  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error(error);
    alert("Listing not found");
    router.push("/my-listings");
    return;
  }

  if (data.user_id !== user.id) {
    alert("You are not allowed to edit this listing.");
    router.push("/my-listings");
    return;
  }

  setTitle(data.title || "");
  setPrice(data.price || "");
  setLocation(data.location || "");
  setImage(data.image || "");
  setDescription(data.description || "");
};

  const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    alert("You must be logged in.");
    router.push("/login");
    return;
  }

  const { error } = await supabase
    .from("listings")
    .update({
      title,
      price,
      location,
      image,
      description,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error(error);
    alert("Failed to update listing");
    return;
  }

  alert("Listing updated!");
  router.push("/my-listings");
};

  if (checkingAuth) {
    return <main className="p-4">Checking login...</main>;
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>

      <form onSubmit={handleUpdate} className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border rounded"
          placeholder="Title"
        />

        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-3 border rounded"
          placeholder="Price"
        />

        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-3 border rounded"
          placeholder="Location"
        />

        <input
          type="text"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="w-full p-3 border rounded"
          placeholder="Image URL"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border rounded"
          placeholder="Description"
          rows={5}
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white p-3 rounded"
        >
          Save Changes
        </button>
      </form>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateListing() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const router = useRouter();

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

    setCheckingAuth(false);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "bird_marketplace_upload");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/ddqd3aauy/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      console.log("Cloudinary response:", data);

      if (!data.secure_url) {
        alert("Image upload failed - no image URL returned");
        return;
      }

      setImage(data.secure_url);
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      alert("Please upload an image first.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You must be logged in to post a listing.");
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("listings").insert([
      {
        title,
        price,
        location,
        image,
        description,
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      alert("Listing created!");

      setTitle("");
      setPrice("");
      setLocation("");
      setImage("");
      setDescription("");

      router.push("/my-listings");
    }
  };

  if (checkingAuth) {
    return <main className="p-4">Checking login...</main>;
  }

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Listing 🐦</h1>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Title (e.g. Pair of Budgies)"
          className="w-full p-3 border rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Price (e.g. $80)"
          className="w-full p-3 border rounded"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Location (e.g. Sydney, NSW)"
          className="w-full p-3 border rounded"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />

        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full"
          />

          {uploading && (
            <p className="text-sm text-gray-500">Uploading image...</p>
          )}

          {image && (
            <div className="space-y-2">
              <p className="text-sm text-green-600">
                Image uploaded successfully
              </p>
              <img
                src={image}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
            </div>
          )}
        </div>

        <textarea
          placeholder="Description"
          className="w-full p-3 border rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={uploading || !image}
          className="w-full bg-green-600 text-white p-3 rounded disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "Post Listing"}
        </button>
      </form>
    </main>
  );
}
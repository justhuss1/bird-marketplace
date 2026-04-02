"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateListingPage() {
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [image, setImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [category, setCategory] = useState("");

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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "bird_marketplace_upload");

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();

        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        }
      }

      if (uploadedUrls.length === 0) {
        alert("Image upload failed.");
        return;
      }

      setImages(uploadedUrls);
      setImage(uploadedUrls[0]);
    } catch (error) {
      console.error(error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (images.length === 0 && !image) {
      alert("Please upload at least one image first.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("You must be logged in to post a listing.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("listings").insert([
      {
        title,
        price,
        location,
        category,
        image: images[0] || image,
        images,
        description,
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error(error);
      alert(error.message);
      setSubmitting(false);
      return;
    }

    alert("Listing created!");
    setTitle("");
    setPrice("");
    setLocation("");
    setCategory("");
    setImage("");
    setImages([]);
    setDescription("");
    router.push("/my-listings");
  };

  if (checkingAuth) {
    return <main className="p-4">Checking login...</main>;
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

        <div className="bg-white rounded-2xl shadow p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Create Listing
            </h1>
            <p className="text-gray-500 mt-2">
              Add your bird listing to the marketplace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* IMAGE UPLOAD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Photos
              </label>

              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50 text-center hover:border-green-500 transition">
                {images.length === 0 && (
                  <>
                    <p className="text-gray-500 text-sm mb-2">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG up to 5MB. You can select multiple images.
                    </p>
                  </>
                )}

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="w-full mt-3 text-sm text-gray-600"
                />

                {uploading && (
                  <p className="text-sm text-gray-500 mt-3">
                    Uploading images...
                  </p>
                )}

                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* TITLE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Listing Title
              </label>
              <input
                type="text"
                placeholder="e.g. Pair of Budgies"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 text-black outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-xl p-3 text-black outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select a category</option>
                <option value="Parrots">Parrots</option>
                <option value="Cockatiels">Cockatiels</option>
                <option value="Finches">Finches</option>
                <option value="Canaries">Canaries</option>
                <option value="Supplies">Supplies</option>
              </select>
            </div>

            {/* PRICE + LOCATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">$</span>
                  <input
                    type="text"
                    placeholder="150"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-3 pl-8 text-black outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sydney, NSW"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 text-black outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Include age, temperament, and pickup details.
              </p>
              <textarea
                placeholder="Describe the bird, age, temperament, condition, pickup details, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full border border-gray-300 rounded-xl p-3 text-black outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={uploading || submitting || images.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {uploading
                ? "Uploading..."
                : submitting
                ? "Posting..."
                : "Post Listing"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
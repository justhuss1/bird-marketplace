"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import {
  ArrowLeft,
  Upload,
  MapPin,
  DollarSign,
  FileText,
  Tag,
  Image as ImageIcon,
  Crosshair,
} from "lucide-react";

const PET_CATEGORIES = [
  "Birds",
  "Cats",
  "Dogs",
  "Fish",
  "Horses & Ponies",
  "Livestock",
  "Reptiles & Amphibians",
  "Rabbits",
  "Pet Supplies",
] as const;

const getCategoryFields = (category: string) => {
  switch (category) {
    case "Dogs":
    case "Cats":
    case "Rabbits":
      return [
        { key: "breed", label: "Breed" },
        { key: "age", label: "Age" },
        { key: "gender", label: "Gender" },
        { key: "vaccinated", label: "Vaccinated" },
        { key: "desexed", label: "Desexed" },
      ];

    case "Birds":
      return [
        { key: "species", label: "Species / Breed" },
        { key: "age", label: "Age" },
        { key: "gender", label: "Gender" },
        { key: "handRaised", label: "Hand Raised" },
        { key: "cageIncluded", label: "Cage Included" },
      ];

    case "Fish":
      return [
        { key: "species", label: "Species" },
        { key: "tankSize", label: "Tank Size" },
        { key: "waterType", label: "Water Type" },
        { key: "age", label: "Age" },
      ];

    case "Horses & Ponies":
      return [
        { key: "breed", label: "Breed" },
        { key: "age", label: "Age" },
        { key: "gender", label: "Gender" },
        { key: "height", label: "Height" },
        { key: "experienceLevel", label: "Experience Level" },
      ];

    case "Livestock":
      return [
        { key: "animalType", label: "Animal Type" },
        { key: "breed", label: "Breed" },
        { key: "age", label: "Age" },
        { key: "quantity", label: "Quantity" },
      ];

    case "Reptiles & Amphibians":
      return [
        { key: "species", label: "Species" },
        { key: "age", label: "Age" },
        { key: "sex", label: "Sex" },
        { key: "enclosureIncluded", label: "Enclosure Included" },
        { key: "feedingType", label: "Feeding Type" },
      ];

    case "Pet Supplies":
      return [
        { key: "itemType", label: "Item Type" },
        { key: "brand", label: "Brand" },
        { key: "condition", label: "Condition" },
      ];

    default:
      return [];
  }
};

type GeocodeResult = {
  latitude: number | null;
  longitude: number | null;
  displayName?: string;
};

export default function CreateListingPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  const handleAttributeChange = (key: string, value: string) => {
    setAttributes((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setAttributes({});
  };

  const geocodeLocation = async (query: string): Promise<GeocodeResult> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=au&q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        return { latitude: null, longitude: null };
      }

      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        return { latitude: null, longitude: null };
      }

      return {
        latitude: Number(data[0].lat),
        longitude: Number(data[0].lon),
        displayName: data[0].display_name,
      };
    } catch (error) {
      console.error("Geocoding failed:", error);
      return { latitude: null, longitude: null };
    }
  };

  const reverseGeocode = async (
    lat: number,
    lng: number
  ): Promise<GeocodeResult> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!res.ok) {
        return {
          latitude: lat,
          longitude: lng,
        };
      }

      const data = await res.json();

      const address = data?.address || {};
      const bestLocation =
        address.city ||
        address.town ||
        address.suburb ||
        address.village ||
        address.state ||
        data?.display_name;

      return {
        latitude: lat,
        longitude: lng,
        displayName: bestLocation || "",
      };
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      return {
        latitude: lat,
        longitude: lng,
      };
    }
  };

  const handleUseCurrentLocation = async () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported on this device.");
    return;
  }

  setGettingLocation(true);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      setLatitude(lat);
      setLongitude(lng);

      try {
        const result = await reverseGeocode(lat, lng);
        if (result.displayName) {
          setLocation(result.displayName);
        }
      } catch (err) {
        console.error("Reverse geocode failed:", err);
      }

      setGettingLocation(false);
    },
    (error) => {
      console.error("Geolocation error:", error);

      let message = "Unable to get your location.";

      if (error.code === 1) {
        message =
          "Location permission denied. Please allow location access in your browser.";
      } else if (error.code === 2) {
        message =
          "Location unavailable. Try again or check your device location settings.";
      } else if (error.code === 3) {
        message =
          "Location request timed out. Try again or move to a better signal area.";
      }

      alert(message);
      setGettingLocation(false);
    },
    {
      enableHighAccuracy: false, // 🔑 IMPORTANT (fixes most desktop issues)
      timeout: 20000,            // more forgiving
      maximumAge: 60000,
    }
  );
};

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!cloudName || !uploadPreset) {
      alert(
        "Cloudinary environment variables are missing. Please check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
      );
      return;
    }

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();

        if (!res.ok || !data.secure_url) {
          console.error("Cloudinary upload failed:", data);
          throw new Error("Failed to upload one or more images.");
        }

        uploadedUrls.push(data.secure_url);
      }

      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error(error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCreateListing = async () => {
    if (!title || !price || !location || !category || !description) {
      alert("Please complete all required fields.");
      return;
    }

    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first.");
      router.push("/login");
      setSubmitting(false);
      return;
    }

    let finalLatitude = latitude;
    let finalLongitude = longitude;

    if (finalLatitude === null || finalLongitude === null) {
      const geocoded = await geocodeLocation(location);
      finalLatitude = geocoded.latitude;
      finalLongitude = geocoded.longitude;
    }

    const primaryImage = images.length > 0 ? images[0] : null;

    const { error } = await supabase.from("listings").insert([
      {
        title,
        price,
        location,
        category,
        description,
        image: primaryImage,
        images,
        attributes,
        user_id: user.id,
        latitude: finalLatitude,
        longitude: finalLongitude,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Failed to create listing.");
      setSubmitting(false);
      return;
    }

    router.push("/my-listings");
  };

  return (
    <main className="bg-gray-50 min-h-screen py-6 sm:py-8 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="mt-5 bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#07111f] via-[#102038] to-[#1b2e4a] px-6 sm:px-8 py-10 sm:py-12 text-white">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
              Create a New Listing
            </h1>

            <p className="mt-3 text-white/80 max-w-2xl text-sm sm:text-base leading-7">
              Add your pet or pet-related item to the marketplace with clear
              details, strong photos, and category-specific information.
            </p>
          </div>

          <div className="px-6 sm:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Tag size={16} />
                    Listing Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Purebred Labrador Puppies"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <DollarSign size={16} />
                    Price
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <MapPin size={16} />
                    Location
                  </label>

                  <div className="space-y-3">
                    <LocationAutocomplete
                      value={location}
                      onChange={(value) => {
                        setLocation(value);
                        setLatitude(null);
                        setLongitude(null);
                      }}
                      placeholder="Enter location"
                    />

                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={gettingLocation}
                      className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 text-sm font-semibold transition disabled:opacity-50"
                    >
                      <Crosshair size={16} />
                      {gettingLocation ? "Getting location..." : "Use my current location"}
                    </button>

                    {(latitude !== null && longitude !== null) && (
                      <p className="text-xs text-green-600">
                        Coordinates captured for distance-based search.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Tag size={16} />
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
                  >
                    <option value="">Select a category</option>
                    {PET_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <p className="text-xs text-gray-500 mt-2">
                    Select the most relevant category to help buyers find your
                    listing faster.
                  </p>
                </div>

                {category && getCategoryFields(category).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                      Category Details
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {getCategoryFields(category).map((field) => (
                        <div key={field.key}>
                          <label className="text-sm font-semibold text-gray-900 mb-2 block">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            value={attributes[field.key] || ""}
                            onChange={(e) =>
                              handleAttributeChange(field.key, e.target.value)
                            }
                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
                            placeholder={field.label}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Description
                  </label>
                  <textarea
                    placeholder="Describe the pet or item, temperament, age, condition, pickup details, or anything buyers should know."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={12}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-500 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <label className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ImageIcon size={16} />
                Images
              </label>

              <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6 sm:p-7 hover:border-green-400 transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Upload listing photos
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      The first image will be used as your main cover photo.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md hover:shadow-lg cursor-pointer">
                      <Upload size={16} />
                      {uploading ? "Uploading..." : "Upload Images"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    <label className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition cursor-pointer">
                      <ImageIcon size={16} />
                      Take Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  On mobile, “Take Photo” can open your camera directly on supported devices.
                </p>

                {images.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                      <div
                        key={index}
                        className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
                      >
                        <img
                          src={img}
                          alt={`Uploaded ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />

                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2.5 py-1 rounded-full">
                            Cover
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 text-xs px-2 py-1 rounded-full shadow"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCreateListing}
                disabled={submitting || uploading || gettingLocation}
                className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-6 py-3.5 text-sm font-semibold transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating Listing..." : "Create Listing"}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3.5 text-sm font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
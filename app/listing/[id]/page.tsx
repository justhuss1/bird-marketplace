"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Heart,
  MapPin,
  ShieldCheck,
  MessageCircle,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  CalendarDays,
  Tag,
} from "lucide-react";

type Listing = {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string | null;
  images?: string[] | null;
  description: string;
  user_id: string;
  category?: string | null;
  is_featured?: boolean | null;
  boost_until?: string | null;
  created_at?: string;
  attributes?: Record<string, string> | null;
};

type SellerProfile = {
  id: string;
  username: string | null;
  created_at: string;
};

const normalizeImages = (
  images: unknown,
  fallbackImage?: string | null
): string[] => {
  if (Array.isArray(images)) {
    return images.filter(
      (img): img is string => typeof img === "string" && img.trim() !== ""
    );
  }

  if (typeof images === "string" && images.trim() !== "") {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (img): img is string => typeof img === "string" && img.trim() !== ""
        );
      }
    } catch {
      return [images];
    }
  }

  return fallbackImage ? [fallbackImage] : [];
};

const formatAttributeLabel = (key: string) => {
  const customLabels: Record<string, string> = {
    breed: "Breed",
    age: "Age",
    gender: "Gender",
    vaccinated: "Vaccinated",
    desexed: "Desexed",
    species: "Species / Breed",
    handRaised: "Hand Raised",
    cageIncluded: "Cage Included",
    tankSize: "Tank Size",
    waterType: "Water Type",
    height: "Height",
    experienceLevel: "Experience Level",
    animalType: "Animal Type",
    quantity: "Quantity",
    sex: "Sex",
    enclosureIncluded: "Enclosure Included",
    feedingType: "Feeding Type",
    itemType: "Item Type",
    brand: "Brand",
    condition: "Condition",
  };

  return (
    customLabels[key] ||
    key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
  );
};

const formatAttributeValue = (value: string) => {
  const normalized = value.trim().toLowerCase();

  if (normalized === "yes") return "Yes";
  if (normalized === "no") return "No";
  if (normalized === "male") return "Male";
  if (normalized === "female") return "Female";

  return value;
};

export default function ListingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [sellerListingCount, setSellerListingCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchListing();
      checkIfSaved();
    }
  }, [id]);

  const fetchSellerStats = async (sellerId: string) => {
    const { count, error } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", sellerId);

    if (error) {
      console.error(error);
      return;
    }

    setSellerListingCount(count || 0);
  };

  const fetchListing = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("ERROR:", error);
      setLoading(false);
      return;
    }

    setListing(data as Listing);

    const normalized = normalizeImages(data.images, data.image);
    setGalleryImages(normalized);
    setSelectedImage(
      normalized[0] ||
        "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=1200"
    );

    const { data: sellerData, error: sellerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user_id)
      .single();

    if (!sellerError && sellerData) {
      setSeller(sellerData as SellerProfile);
    }

    fetchSellerStats(data.user_id);
    setLoading(false);
  };

  const checkIfSaved = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("saved_listings")
      .select("*")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .maybeSingle();

    setIsSaved(!error && !!data);
  };

  const handleToggleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in to save listings.");
      router.push("/login");
      return;
    }

    if (!listing) return;

    if (isSaved) {
      const { error } = await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listing.id);

      if (error) {
        console.error(error);
        alert("Failed to remove saved listing");
        return;
      }

      setIsSaved(false);
    } else {
      const { error } = await supabase.from("saved_listings").insert([
        {
          user_id: user.id,
          listing_id: listing.id,
        },
      ]);

      if (error) {
        console.error(error);
        alert("Failed to save listing");
        return;
      }

      setIsSaved(true);
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

    if (!listing) return;

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

  const goToPrevImage = () => {
    if (galleryImages.length <= 1) return;
    const currentIndex = galleryImages.indexOf(selectedImage);
    const prevIndex =
      currentIndex <= 0 ? galleryImages.length - 1 : currentIndex - 1;
    setSelectedImage(galleryImages[prevIndex]);
  };

  const goToNextImage = () => {
    if (galleryImages.length <= 1) return;
    const currentIndex = galleryImages.indexOf(selectedImage);
    const nextIndex =
      currentIndex >= galleryImages.length - 1 ? 0 : currentIndex + 1;
    setSelectedImage(galleryImages[nextIndex]);
  };

  const formatJoinedDate = (date?: string) => {
    if (!date) return "recently";
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  };

  const formatPostedDate = (date?: string) => {
    if (!date) return "Recently listed";
    const posted = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - posted.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Listed today";
    if (diffDays === 1) return "Listed yesterday";
    if (diffDays < 7) return `Listed ${diffDays} days ago`;

    return `Listed ${posted.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`;
  };

  if (loading) {
    return <main className="p-4">Loading listing...</main>;
  }

  if (!listing) {
    return (
      <main className="bg-gray-50 min-h-screen px-4 py-8 pb-24">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="mt-8 bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Listing not found</h1>
            <p className="mt-2 text-gray-500">
              This listing may have been removed or is no longer available.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen px-4 py-6 sm:py-8 pb-24">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1.35fr_0.9fr] gap-6">
          {/* LEFT */}
          <div className="space-y-5">
            <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative overflow-hidden">
                <img
                  src={selectedImage}
                  alt={listing.title}
                  className="w-full h-[320px] sm:h-[460px] object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/35 to-transparent pointer-events-none" />

                {listing.is_featured && (
                  <span className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                    ★ Featured
                  </span>
                )}

                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow flex items-center justify-center hover:bg-white transition"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      onClick={goToNextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur shadow flex items-center justify-center hover:bg-white transition"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                <button
                  onClick={handleToggleSave}
                  className={`absolute top-4 right-4 text-xs px-3 py-1 rounded-full font-medium shadow backdrop-blur transition ${
                    isSaved ? "bg-red-500 text-white" : "bg-white/90 text-gray-800"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Heart size={14} />
                    {isSaved ? "Saved" : "Save"}
                  </span>
                </button>
              </div>

              {galleryImages.length > 1 && (
                <div className="p-3 sm:p-4 border-t border-gray-100">
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {galleryImages.map((img, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setSelectedImage(img)}
                        className={`rounded-2xl overflow-hidden border-2 transition ${
                          selectedImage === img
                            ? "border-green-600"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-20 sm:h-24 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {listing.category && (
                      <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                        <Tag size={12} />
                        {listing.category}
                      </span>
                    )}

                    <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                      Available now
                    </span>

                    {listing.boost_until &&
                      new Date(listing.boost_until) > new Date() && (
                        <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                          Boosted
                        </span>
                      )}
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-gray-900">
                    {listing.title}
                  </h1>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={15} />
                      {listing.location}
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={15} />
                      {formatPostedDate(listing.created_at)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <div className="bg-green-50 text-green-600 px-5 py-3 rounded-2xl text-3xl font-semibold">
                    ${listing.price}
                  </div>
                </div>
              </div>

              {listing.attributes && Object.keys(listing.attributes).length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Category Details
                    </h2>

                    {listing.category && (
                      <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
                        {listing.category}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(listing.attributes)
                      .filter(([, value]) => value && value.trim() !== "")
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4"
                        >
                          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                            {formatAttributeLabel(key)}
                          </p>
                          <p className="text-sm sm:text-[15px] font-semibold text-gray-900 mt-2">
                            {formatAttributeValue(value)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Description
                </h2>
                <p className="text-gray-700 leading-7 whitespace-pre-line">
                  {listing.description || "No description provided."}
                </p>
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Seller
              </h2>

              <button
                onClick={handleMessageSeller}
                className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white py-3.5 text-sm font-semibold transition shadow-md"
              >
                Message Seller
              </button>

              <p className="text-sm text-gray-500 mt-3 leading-6">
                Ask about availability, pickup arrangements, price, or any
                details about this pet or listing before you commit.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3">
                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700 flex items-center gap-2">
                  <ShieldCheck size={16} className="text-green-600" />
                  Safe in-app messaging
                </div>

                <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700 flex items-center gap-2">
                  <MessageCircle size={16} className="text-green-600" />
                  Direct buyer and seller chat
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Seller</h2>
                <Link
                  href={`/seller/${listing.user_id}`}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
                >
                  View profile
                </Link>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-lg font-bold text-green-700 shadow-sm">
                  {seller?.username?.charAt(0).toUpperCase() || <User size={18} />}
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 line-clamp-1">
                    {seller?.username || "User"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Member since {formatJoinedDate(seller?.created_at)}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-gray-50 px-4 py-3 flex items-center gap-3">
                  <ShieldCheck size={16} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Verified account
                    </p>
                    <p className="text-xs text-gray-500">
                      Authenticated user profile
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 px-4 py-3 flex items-center gap-3">
                  <MessageCircle size={16} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {sellerListingCount} active listing
                      {sellerListingCount === 1 ? "" : "s"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Browse more from this seller
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 px-4 py-3 flex items-center gap-3">
                  <User size={16} className="text-green-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Seller profile available
                    </p>
                    <p className="text-xs text-gray-500">
                      View seller details and listings
                    </p>
                  </div>
                </div>
              </div>

              <Link href={`/seller/${listing.user_id}`}>
                <button className="w-full mt-5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 py-3 text-sm font-semibold transition">
                  View Seller Profile
                </button>
              </Link>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
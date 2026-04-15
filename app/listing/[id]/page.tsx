"use client";

import { useEffect, useRef, useState } from "react";
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
  Eye,
  Flag,
  Share2,
  Star,
  X,
  ZoomIn,
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
  view_count?: number | null;
  profiles?: {
    username?: string | null;
    breeder_name?: string | null;
    breeder_verified?: boolean | null;
    is_breeder?: boolean | null;
  } | null;
};

type SellerProfile = {
  id: string;
  username: string | null;
  created_at: string;
  is_breeder?: boolean | null;
  breeder_name?: string | null;
  breeder_bio?: string | null;
  breeder_verified?: boolean | null;
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
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerListings, setSellerListings] = useState<any[]>([]);
  const sellerName =
  seller?.breeder_name || seller?.username || "Seller";
  const sellerListingsCount = sellerListings?.length || 0;
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  

  useEffect(() => {
    if (id) {
      fetchListing();
      checkIfSaved();
    }
  }, [id]);

  useEffect(() => {
    if (listing?.user_id) {
      fetchSellerListings(listing.user_id);
    }
    }, [listing]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        goToPrevLightboxImage();
      } else if (e.key === "ArrowRight") {
        goToNextLightboxImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, selectedImage, galleryImages]);

  const fetchSellerListings = async (userId: string) => {
    const { data, error } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", userId);

    if (error) {
      console.error(error);
      return;
    }

    setSellerListings(data || []);
  };

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

  const incrementViewCount = async (listingId: string, currentCount?: number | null) => {
    const nextCount = (currentCount || 0) + 1;

    const { error } = await supabase
      .from("listings")
      .update({ view_count: nextCount })
      .eq("id", listingId);

    if (!error) {
      setListing((prev) => (prev ? { ...prev, view_count: nextCount } : prev));
    }
  };

  const fetchSimilarListings = async (
    listingId: string,
    category?: string | null,
    location?: string | null
  ) => {
    let query = supabase
      .from("listings")
      .select("*")
      .neq("id", listingId)
      .order("created_at", { ascending: false })
      .limit(4);

    if (category) {
      query = query.eq("category", category);
    } else if (location) {
      query = query.eq("location", location);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return;
    }

    const listingsData = (data || []) as Listing[];

    const userIds = Array.from(
      new Set(
        listingsData
          .map((item) => item.user_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (userIds.length === 0) {
      setSimilarListings(listingsData);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, breeder_name, breeder_verified, is_breeder")
      .in("id", userIds);

    if (profileError) {
      console.error(profileError);
      setSimilarListings(listingsData);
      return;
    }

    const profileMap = new Map(
      (profileData || []).map((profile) => [profile.id, profile])
    );

    const mergedListings = listingsData.map((item) => ({
      ...item,
      profiles: item.user_id ? profileMap.get(item.user_id) || null : null,
    }));

    setSimilarListings(mergedListings);
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

    const listingData = data as Listing;
    setListing(listingData);

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
    fetchSimilarListings(data.id, data.category, data.location);
    incrementViewCount(data.id, data.view_count);
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

  const getSellerLabel = (item: Listing) => {
    return (
      item.profiles?.breeder_name ||
      item.profiles?.username ||
      "Seller"
    );
  };

  const sellerDisplayName =
    seller?.breeder_name || seller?.username || "Seller";

  const handleShareListing = async () => {
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: listing?.title || "Pet Marketplace Listing",
          text: "Check out this listing on Pet Marketplace",
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      alert("Listing link copied to clipboard.");
    } catch (error) {
      console.error(error);
      alert("Could not share this listing.");
    }
  };

  const handleReportListing = async () => {
    if (!listing) return;

    const reason = window.prompt(
      "Please enter a short reason for reporting this listing:"
    );

    if (!reason || !reason.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("reported_listings").insert([
      {
        listing_id: listing.id,
        user_id: user?.id || null,
        reason: reason.trim(),
      },
    ]);

    if (error) {
      console.error(error);
      alert("Could not report this listing.");
      return;
    }

    alert("Thanks. This listing has been reported for review.");
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

  const openLightbox = () => {
    if (!selectedImage) return;
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevLightboxImage = () => {
    if (galleryImages.length <= 1) return;
    const currentIndex = galleryImages.indexOf(selectedImage);
    const prevIndex =
      currentIndex <= 0 ? galleryImages.length - 1 : currentIndex - 1;
    setSelectedImage(galleryImages[prevIndex]);
  };

  const goToNextLightboxImage = () => {
    if (galleryImages.length <= 1) return;
    const currentIndex = galleryImages.indexOf(selectedImage);
    const nextIndex =
      currentIndex >= galleryImages.length - 1 ? 0 : currentIndex + 1;
    setSelectedImage(galleryImages[nextIndex]);
  };

  const handleLightboxTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.changedTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleLightboxTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    touchEndXRef.current = e.changedTouches[0].clientX;
  };

  const handleLightboxTouchEnd = () => {
    const startX = touchStartXRef.current;
    const endX = touchEndXRef.current;

    if (startX === null || endX === null) return;

    const distance = startX - endX;
    const swipeThreshold = 50;

    if (distance > swipeThreshold) {
      goToNextLightboxImage();
    } else if (distance < -swipeThreshold) {
      goToPrevLightboxImage();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
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
    <main className="bg-gray-50 min-h-screen px-4 py-6 sm:py-8 pb-32">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1.35fr_0.9fr] gap-6">
          <div className="space-y-5">
            <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative overflow-hidden">
                <button
                  type="button"
                  onClick={openLightbox}
                  className="block w-full text-left"
                >
                  <img
                    src={selectedImage}
                    alt={listing.title}
                    className="w-full h-[320px] sm:h-[460px] object-cover transition duration-500 hover:scale-[1.02]"
                  />
                </button>

                <button
                  type="button"
                  onClick={openLightbox}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur text-gray-800 px-3 py-2 text-xs font-medium shadow hover:bg-white transition"
                >
                  <ZoomIn size={14} />
                  Tap to zoom
                </button>

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
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2">
                  {listing.category && (
                    <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                      🐾 {listing.category}
                    </span>
                  )}

                  {seller?.is_breeder && (
                    <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                      Breeder Listing
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

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="min-w-0">
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

                      <span className="inline-flex items-center gap-1.5">
                        <Eye size={15} />
                        {listing.view_count || 0} views
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div className="rounded-3xl border border-gray-100 bg-gray-50 px-5 py-4">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-500">
                        Price
                      </p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        ${listing.price}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3">
                  <button
                    onClick={handleToggleSave}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition inline-flex items-center gap-2 ${
                      isSaved
                        ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                        : "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    <Heart size={16} className={isSaved ? "fill-current" : ""} />
                    {isSaved ? "Saved" : "Save listing"}
                  </button>

                  <button
                    onClick={handleShareListing}
                    className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 text-sm font-semibold transition inline-flex items-center gap-2"
                  >
                    <Share2 size={16} />
                    Share
                  </button>

                  <button
                    onClick={handleReportListing}
                    className="rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 text-sm font-semibold transition inline-flex items-center gap-2"
                  >
                    <Flag size={16} />
                    Report
                  </button>
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
                <p className="text-gray-700 leading-8 whitespace-pre-line text-[15px]">
                  {listing.description || "No description provided."}
                </p>
              </div>
            </section>
          </div>

          <div className="flex flex-col space-y-5 xl:sticky xl:top-24 self-start">
            <section className="order-2 xl:order-1 bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Contact Seller
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Start a conversation about this listing
                    </p>
                  </div>

                  <div className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">
                    Secure chat
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-3xl border border-green-100 bg-gradient-to-br from-green-50 to-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white border border-green-100 flex items-center justify-center shrink-0">
                      <MessageCircle size={18} className="text-green-600" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Message the seller directly
                      </p>
                      <p className="text-sm text-gray-500 mt-1 leading-6">
                        Ask about availability, health details, inclusions, pickup, or negotiate before committing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <button
                    onClick={handleMessageSeller}
                    className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white py-3.5 text-sm font-semibold transition shadow-md hover:shadow-lg"
                  >
                    Message Seller
                  </button>

                  <button
                    onClick={handleShareListing}
                    className="w-full rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 py-3.5 text-sm font-semibold transition"
                  >
                    Share Listing
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3">
                  <div className="rounded-2xl bg-gray-50 px-4 py-3 flex items-center gap-3">
                    <ShieldCheck size={16} className="text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Safe in-app messaging
                      </p>
                      <p className="text-xs text-gray-500">
                        Keep conversations secure inside the platform
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 px-4 py-3 flex items-center gap-3">
                    <MessageCircle size={16} className="text-green-600 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Fast direct contact
                      </p>
                      <p className="text-xs text-gray-500">
                        Reach the seller without leaving the platform
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="order-1 xl:order-2 bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">

              {/* HEADER */}
              <div className="bg-gradient-to-r from-[#07111f] via-[#102038] to-[#1b2e4a] px-5 py-5 text-white">
                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/10 flex items-center justify-center font-semibold text-lg">
                    {sellerDisplayName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-white/70">
                      {seller?.is_breeder ? "Breeder" : "Seller"}
                    </p>

                    <p className="text-sm font-semibold truncate">
                      {sellerDisplayName}
                    </p>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {seller?.is_breeder && (
                        <span className="text-[10px] bg-green-500/20 text-green-200 px-2 py-0.5 rounded-full">
                          Breeder
                        </span>
                      )}

                      {seller?.breeder_verified && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* STATS */}
              <div className="px-5 py-4 border-b border-gray-100 grid grid-cols-2 gap-3">

                <div className="bg-gray-50 rounded-2xl px-4 py-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Listings
                  </p>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {sellerListingsCount}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl px-4 py-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Joined
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatJoinedDate(seller?.created_at)}
                  </p>
                </div>

              </div>

              {/* TRUST BLOCK */}
              <div className="px-5 py-4 space-y-3">

                <div className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                  <ShieldCheck size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Verified account
                    </p>
                    <p className="text-xs text-gray-500">
                      Authenticated platform user
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                  <Star size={16} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {sellerListingsCount} active listings
                    </p>
                    <p className="text-xs text-gray-500">
                      Browse more from this seller
                    </p>
                  </div>
                </div>

                {seller?.is_breeder && (
                  <div className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                    <User size={16} className="text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Breeder profile available
                      </p>
                      <p className="text-xs text-gray-500">
                        View litters, updates & breeder info
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* CTA */}
              <div className="px-5 pb-5 space-y-3">

                <button
                  onClick={handleMessageSeller}
                  className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white py-3.5 text-sm font-semibold transition shadow-md"
                >
                  Message Seller
                </button>

                {seller?.is_breeder && (
                  <Link href={`/breeders/${listing.user_id}`}>
                    <button className="w-full rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 py-3.5 text-sm font-semibold transition">
                      View Breeder Profile
                    </button>
                  </Link>
                )}

              </div>
            </section>
          </div>
        </div>

        {similarListings.length > 0 && (
          <section className="mt-10">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                  Similar Listings
                </p>
                <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                  You may also like
                </h2>
                <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                  More listings related to this category and location.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {similarListings.map((item) => (
                <Link key={item.id} href={`/listing/${item.id}`}>
                  <article className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden">
                    <div className="relative overflow-hidden">
                      <img
                        src={
                          item.image && item.image !== ""
                            ? item.image
                            : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=900"
                        }
                        alt={item.title}
                        className="h-52 w-full object-cover group-hover:scale-105 transition duration-500"
                      />

                      {item.is_featured ? (
                        <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                          ★ Featured
                        </span>
                      ) : (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-gray-800 text-xs px-3 py-1 rounded-full shadow font-medium">
                          New
                        </span>
                      )}

                      <div className="absolute left-3 bottom-4">
                        <span className="inline-flex rounded-full bg-white/95 backdrop-blur text-green-600 px-3 py-1.5 text-[15px] font-bold shadow">
                          ${item.price}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2 min-w-0 flex-wrap">
                        {item.profiles?.is_breeder && (
                          <span className="inline-flex rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[10px] font-semibold">
                            Breeder
                          </span>
                        )}

                        {item.profiles?.breeder_verified && (
                          <span className="inline-flex rounded-full bg-yellow-50 text-yellow-700 px-2 py-0.5 text-[10px] font-semibold">
                            Verified
                          </span>
                        )}

                        {(item.profiles?.is_breeder || item.profiles?.breeder_verified) && (
                          <span className="truncate text-[10px] text-gray-500">
                            {getSellerLabel(item)}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-[17px] text-gray-900 line-clamp-2 leading-snug min-h-[46px]">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm text-gray-500 flex items-center gap-1.5">
                        <MapPin size={14} className="shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex max-w-full truncate text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                          {item.category || "Pet Listing"}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      
      {/* STICKY MOBILE CTA */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-gray-500">
                Price
              </p>
              <p className="text-lg font-bold text-gray-900">
                ${listing.price}
              </p>
            </div>

            <button
              onClick={handleToggleSave}
              className={`flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isSaved
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : "bg-gray-100 text-gray-800 border border-gray-200"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Heart size={15} className={isSaved ? "fill-current" : ""} />
                {isSaved ? "Saved" : "Save"}
              </span>
            </button>
          </div>

          <button
            onClick={handleMessageSeller}
            className="w-full rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3.5 text-sm font-semibold transition shadow-md"
          >
            Message Seller
          </button>
        </div>
      </div>
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm">
          <div className="absolute inset-0 flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-4">
              <div className="text-white text-sm">
                {galleryImages.indexOf(selectedImage) + 1} / {galleryImages.length}
              </div>

              <button
                type="button"
                onClick={closeLightbox}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Main image area */}
            <div
                className="relative flex-1 flex items-center justify-center px-4 sm:px-8"
                onTouchStart={handleLightboxTouchStart}
                onTouchMove={handleLightboxTouchMove}
                onTouchEnd={handleLightboxTouchEnd}
              >
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={goToPrevLightboxImage}
                  className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              <img
                src={selectedImage}
                alt={listing.title}
                className="max-h-[75vh] sm:max-h-[78vh] max-w-full object-contain rounded-2xl select-none pointer-events-none"
                draggable={false}
              />

              {galleryImages.length > 1 && (
                <button
                  type="button"
                  onClick={goToNextLightboxImage}
                  className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="px-4 sm:px-6 pb-5 pt-3">
                <div className="flex gap-3 overflow-x-auto scrollbar-hide justify-start sm:justify-center">
                  {galleryImages.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setSelectedImage(img);
                        setLightboxOpen(true);
                      }}
                      className={`shrink-0 rounded-2xl overflow-hidden border-2 transition ${
                        selectedImage === img
                          ? "border-green-500"
                          : "border-white/20 hover:border-white/40"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Lightbox thumbnail ${index + 1}`}
                        className="w-20 h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Click outside to close */}
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute inset-0 -z-10"
            aria-label="Close lightbox"
          />
        </div>
      )}
    </main>
    );
}
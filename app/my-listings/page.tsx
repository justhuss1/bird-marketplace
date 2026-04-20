"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  PawPrint,
  MapPin,
  Pencil,
  Trash2,
  Plus,
  ShieldCheck,
  Star,
  Tag,
} from "lucide-react";

type Listing = {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string | null;
  description: string;
  user_id: string;
  category?: string | null;
  is_featured?: boolean | null;
  boost_until?: string | null;
  created_at?: string;
  expires_at?: string | null;
  is_expired?: boolean | null;
  status?: "available" | "pending" | 
"sold" | null;
};

export default function MyListingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setUserEmail(user.email || "");

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setListings((data || []) as Listing[]);
    setLoading(false);
  };

  const handleDelete = async (listingId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this listing?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("listings")
      .delete()
      .eq("id", listingId);

    if (error) {
      console.error(error);
      alert("Failed to delete listing");
      return;
    }

    setListings((prev) => prev.filter((listing) => listing.id !== listingId));
  };

  const handleStatusChange = async (
    listingId: string,
    newStatus: "available" | "pending" | "sold"
  ) => {
    const { error } = await supabase
      .from("listings")
      .update({ status: newStatus })
      .eq("id", listingId);

    if (error) {
      console.error(error);
      alert("Failed to update listing status");
      return;
    }

    setListings((prev) =>
      prev.map((listing) =>
        listing.id === listingId ? { ...listing, status: newStatus } : listing
      )
    );
  };

  const handleRenewListing = async (listingId: string) => {
  const { error } = await supabase
    .from("listings")
    .update({
      expires_at: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      is_expired: false,
    })
    .eq("id", listingId);

  if (error) {
    console.error(error);
    alert("Could not renew listing.");
    return;
  }

  alert("Listing renewed for 30 days.");
  fetchMyListings();
};

  const handleCheckout = async (type: "feature" | "boost", listingId: string) => {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, listingId }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to start checkout");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
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

  const isListingExpired = (listing: Listing) => {
    if (!listing.expires_at) return false;
    return new Date(listing.expires_at).getTime() <= Date.now();
  };

  const formatExpiryDate = (date?: string | null) => {
    if (!date) return "No expiry date";

    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDaysUntilExpiry = (date?: string | null) => {
    if (!date) return null;

    const now = new Date().getTime();
    const expiry = new Date(date).getTime();
    const diffMs = expiry - now;

    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

    if (loading) {
      return <main className="p-4">Loading your listings...</main>;
    }

  const featuredCount = listings.filter((item) => item.is_featured).length;
  const boostedCount = listings.filter(
    (item) => item.boost_until && new Date(item.boost_until) > new Date()
  ).length;

  const expiringSoonListings = listings.filter((item) => {
    if (isListingExpired(item)) return false;

    const daysLeft = getDaysUntilExpiry(item.expires_at);
    return daysLeft !== null && daysLeft <= 5;
  });

  const sortedListings = [...listings].sort((a, b) => {
    const aExpired = isListingExpired(a);
    const bExpired = isListingExpired(b);

    const aDaysLeft = getDaysUntilExpiry(a.expires_at);
    const bDaysLeft = getDaysUntilExpiry(b.expires_at);

    const aExpiringSoon = !aExpired && aDaysLeft !== null && aDaysLeft <= 5;
    const bExpiringSoon = !bExpired && bDaysLeft !== null && bDaysLeft <= 5;

    if (aExpiringSoon && !bExpiringSoon) return -1;
    if (!aExpiringSoon && bExpiringSoon) return 1;

    if (!aExpired && bExpired) return -1;
    if (aExpired && !bExpired) return 1;

    if (aExpiringSoon && bExpiringSoon) {
      return (aDaysLeft ?? 999) - (bDaysLeft ?? 999);
    }

    if (!aExpired && !bExpired) {
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    }

    return (
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
    );
  });

  return (
    <main className="bg-gray-50 min-h-screen py-6 sm:py-8 px-4 pb-24">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* HERO */}
        <section className="mt-5 bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#07111f] via-[#102038] to-[#1b2e4a] px-6 sm:px-8 py-8 sm:py-10 text-white">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 mb-3">
                  <ShieldCheck size={14} />
                  Seller dashboard
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                  My Listings
                </h1>

                <p className="mt-3 text-white/80 max-w-2xl text-sm sm:text-base leading-7">
                  Manage your active pet listings, keep them updated, and track
                  featured or boosted visibility in one place.
                </p>

                {userEmail && (
                  <p className="mt-3 text-sm text-white/65">{userEmail}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/create">
                  <button className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md inline-flex items-center gap-2">
                    <Plus size={16} />
                    New Listing
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                  <PawPrint size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Total Listings
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-5">
                    {listings.length} listing{listings.length === 1 ? "" : "s"} in
                    your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="bg-yellow-50 text-yellow-600 p-2.5 rounded-xl shrink-0">
                  <Star size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Featured Listings
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-5">
                    {featuredCount} featured listing
                    {featuredCount === 1 ? "" : "s"} currently highlighted.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl shrink-0">
                  <Star size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Boosted Listings
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-5">
                    {boostedCount} boosted listing
                    {boostedCount === 1 ? "" : "s"} with extra visibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {expiringSoonListings.length > 0 && (
          <section className="mt-8 bg-white rounded-[28px] border border-amber-200 shadow-sm p-6 sm:p-7">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-amber-600">
                  Expiring Soon
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  Some of your listings need attention
                </h2>
                <p className="mt-3 text-sm text-gray-600 leading-7">
                  You have {expiringSoonListings.length} listing
                  {expiringSoonListings.length === 1 ? "" : "s"} expiring within the next 5 days.
                  Renew them to keep them visible in the marketplace.
                </p>
              </div>
            </div>
            

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {expiringSoonListings.slice(0, 4).map((item) => {
                const daysLeft = getDaysUntilExpiry(item.expires_at);

                return (

                  
                  <div
                    key={item.id}
                    className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Expires {formatExpiryDate(item.expires_at)}
                        </p>
                      </div>

                      <span className="shrink-0 inline-flex rounded-full bg-white text-amber-700 px-2.5 py-1 text-xs font-semibold border border-amber-200">
                        {daysLeft === 0 ? "Today" : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleRenewListing(item.id)}
                        className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 text-sm font-semibold transition"
                      >
                        Renew Listing
                      </button>

                      <Link href={`/edit/${item.id}`}>
                        <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-4 py-2.5 text-sm font-semibold transition">
                          Edit
                        </button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* LISTINGS */}
        <section className="mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Seller Inventory
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                Your listings, ordered by priority
              </h2>
              <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                Edit, review, promote, renew, or remove your marketplace listings.
              </p>
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <PawPrint size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                No listings yet
              </h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Create your first pet listing to start connecting with buyers
                across Australia.
              </p>

              <Link href="/create">
                <button className="mt-6 rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md inline-flex items-center gap-2">
                  <Plus size={16} />
                  Create your first listing
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedListings.map((listing) => {
                const isFeatured = !!listing.is_featured;
                const isBoosted =
                  !!listing.boost_until &&
                  new Date(listing.boost_until) > new Date();
                const isExpired = isListingExpired(listing);

                return (
                  <article
                    key={listing.id}
                    className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden"
                  >
                    <Link href={`/listing/${listing.id}`}>
                      <div className="relative overflow-hidden">
                        <img
                          src={
                            listing.image && listing.image !== ""
                              ? listing.image
                              : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=900"
                          }
                          alt={listing.title}
                          className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
                        />

                        {listing.is_featured && (
                          <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                            ★ Featured
                          </span>
                        )}

                        {isBoosted && (
                          <span className="absolute top-3 right-3 bg-purple-600 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
                            Boosted
                          </span>
                        )}

                        <span
                          className={`absolute bottom-3 left-3 text-xs px-3 py-1 rounded-full shadow font-medium ${
                            isExpired
                              ? "bg-red-50 text-red-600"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {isExpired ? "Expired" : "Active"}
                        </span>
                      </div>
                    </Link>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <Link href={`/listing/${listing.id}`}>
                          <h3 className="font-semibold text-[17px] text-gray-900 line-clamp-1 leading-snug hover:text-green-600 transition">
                            {listing.title}
                          </h3>
                        </Link>

                        <span className="text-green-600 font-semibold text-[18px] whitespace-nowrap">
                          ${listing.price}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                        <MapPin size={14} />
                        {listing.location}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full items-center gap-1.5">
                          <Tag size={12} />
                          {listing.category || "Pet Listing"}
                        </span>

                        <span className={`text-xs ${isExpired ? "text-red-500" : "text-gray-400"}`}>
                          {isExpired
                            ? `Expired ${formatExpiryDate(listing.expires_at)}`
                            : `Expires ${formatExpiryDate(listing.expires_at)}`}
                        </span>
                      </div>

                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                          Listing Status
                        </label>
                        <select
                          value={listing.status || "available"}
                          onChange={(e) =>
                            handleStatusChange(
                              listing.id,
                              e.target.value as "available" | "pending" | "sold"
                            )
                          }
                          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
                        >
                          <option value="available">Available</option>
                          <option value="pending">Pending</option>
                          <option value="sold">Sold</option>
                        </select>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <Link href={`/edit/${listing.id}`}>
                          <button className="w-full rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 text-sm font-medium transition inline-flex items-center justify-center gap-2">
                            <Pencil size={16} />
                            Edit
                          </button>
                        </Link>

                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="w-full rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 text-sm font-medium transition inline-flex items-center justify-center gap-2"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>

                        <button
                          onClick={() =>
                            isExpired
                              ? handleRenewListing(listing.id)
                              : handleCheckout("feature", listing.id)
                          }
                          disabled={!isExpired && isFeatured}
                          className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium transition inline-flex items-center justify-center gap-2 ${
                            isExpired
                              ? "border-green-200 bg-green-50 hover:bg-green-100 text-green-700"
                              : isFeatured
                              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          <Star size={16} />
                          {isExpired ? "Renew" : isFeatured ? "Featured" : "Feature"}
                        </button>

                        <button
                          onClick={() => handleCheckout("boost", listing.id)}
                          disabled={isExpired || isBoosted}
                          className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium transition inline-flex items-center justify-center gap-2 ${
                            isExpired || isBoosted
                              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700"
                          }`}
                        >
                          <Star size={16} />
                          {isExpired ? "Expired" : isBoosted ? "Boosted" : "Boost"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
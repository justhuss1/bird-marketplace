"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import Footer from "@/components/Footer";
import ListingCard from "@/components/ListingCard";

import {
  Bird,
  Search,
  Cat,
  Dog,
  Fish,
  Rabbit,
  Package,
  Turtle,
  Beef,
  X,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  Award,
  BadgeCheck,
  Users,
  ShieldCheck,
  MessageCircle,
  Star,
} from "lucide-react";

type Listing = {
  id: string;
  title: string;
  price: string;
  location: string;
  image: string | null;
  category?: string | null;
  is_featured?: boolean | null;
  boost_until?: string | null;
  expires_at?: string | null;
  is_expired?: boolean | null;
  attributes?: Record<string, string> | null;
  user_id?: string;
  status?: "available" | "pending" | "sold" | null;
  profiles?: {
    username?: string | null;
    breeder_name?: string | null;
    breeder_verified?: boolean | null;
    is_breeder?: boolean | null;
  } | null;
};

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

export default function Home() {
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [latestBreederUpdates, setLatestBreederUpdates] = useState<any[]>([]);
  const [breederOfTheMonth, setBreederOfTheMonth] = useState<any | null>(null);
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [draftSearchTerm, setDraftSearchTerm] = useState("");
  const [draftLocationFilter, setDraftLocationFilter] = useState("");
  const [draftCategoryFilter, setDraftCategoryFilter] = useState("");
  const [showDraftSuggestions, setShowDraftSuggestions] = useState(false);

  useEffect(() => {
    fetchListings();
    fetchLatestBreederUpdates();
    fetchBreederOfTheMonth();

    const storedRecentSearches = localStorage.getItem("recentSearches");
    if (storedRecentSearches) {
      setRecentSearches(JSON.parse(storedRecentSearches));
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickySearch(window.scrollY > 240);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchLatestBreederUpdates = async () => {
    const { data, error } = await supabase
      .from("breeder_announcements")
      .select(`
        *,
        profiles (
          id,
          username,
          breeder_name,
          breeder_verified
        )
      `)
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) {
      console.error(error);
      return;
    }

    setLatestBreederUpdates(data || []);
  };

  const fetchBreederOfTheMonth = async () => {
    const { data: breeders, error } = await supabase
      .from("profiles")
      .select("id, username, breeder_name, breeder_bio, breeder_verified, is_breeder")
      .eq("is_breeder", true);

    if (error) {
      console.error(error);
      return;
    }

    if (!breeders || breeders.length === 0) {
      setBreederOfTheMonth(null);
      return;
    }

    const evaluatedBreeders = await Promise.all(
      breeders.map(async (breeder) => {
        const nowIso = new Date().toISOString();

        const [
          { count: listingsCount },
          { count: followersCount },
          { count: announcementsCount },
        ] = await Promise.all([
          supabase
            .from("listings")
            .select("*", { count: "exact", head: true })
            .eq("user_id", breeder.id)
            .gt("expires_at", nowIso)
            .eq("status", "available"),

          supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("breeder_id", breeder.id),

          supabase
            .from("breeder_announcements")
            .select("*", { count: "exact", head: true })
            .eq("breeder_id", breeder.id),
        ]);

        const score =
          (listingsCount || 0) * 3 +
          (followersCount || 0) * 2 +
          (announcementsCount || 0) * 2 +
          (breeder.breeder_verified ? 5 : 0);

        return {
          ...breeder,
          listingsCount: listingsCount || 0,
          followersCount: followersCount || 0,
          announcementsCount: announcementsCount || 0,
          score,
        };
      })
    );

    const sorted = evaluatedBreeders.sort((a, b) => b.score - a.score);
    setBreederOfTheMonth(sorted[0] || null);
  };

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .eq("status", "available")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Listings fetch error:", error);
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
      setListings(listingsData);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, breeder_name, breeder_verified, is_breeder")
      .in("id", userIds);

    if (profileError) {
      console.error("Profiles fetch error:", profileError);
      setListings(listingsData);
      return;
    }

    const profileMap = new Map(
      (profileData || []).map((profile) => [profile.id, profile])
    );

    const mergedListings = listingsData.map((item) => ({
      ...item,
      profiles: item.user_id ? profileMap.get(item.user_id) || null : null,
    }));

    setListings(mergedListings);
  };

  const formatAnnouncementType = (postType: string) => {
    if (postType === "upcoming_litter") return "Upcoming Litter";
    if (postType === "available_soon") return "Available Soon";
    return "Announcement";
  };

  const formatAnnouncementDate = (date?: string) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  };

  const buildSuggestions = (value: string) => {
    const query = value.toLowerCase().trim();

    if (!query) {
      setSuggestions([]);
      return;
    }

    const pool = new Set<string>();

    listings.forEach((item) => {
      if (item.title?.trim()) pool.add(item.title.trim());
      if (item.category?.trim()) pool.add(item.category.trim());

      Object.values(item.attributes || {}).forEach((attrValue) => {
        if (typeof attrValue === "string" && attrValue.trim()) {
          pool.add(attrValue.trim());
        }
      });
    });

    const matches = Array.from(pool)
      .filter((entry) => entry.toLowerCase().includes(query))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(query) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(query) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b);
      })
      .slice(0, 6);

    setSuggestions(matches);
  };

  const buildDraftSuggestions = (value: string) => {
    const query = value.toLowerCase().trim();

    if (!query) {
      setSuggestions([]);
      return;
    }

    const pool = new Set<string>();

    listings.forEach((item) => {
      if (item.title?.trim()) pool.add(item.title.trim());
      if (item.category?.trim()) pool.add(item.category.trim());

      Object.values(item.attributes || {}).forEach((attrValue) => {
        if (typeof attrValue === "string" && attrValue.trim()) {
          pool.add(attrValue.trim());
        }
      });
    });

    const matches = Array.from(pool)
      .filter((entry) => entry.toLowerCase().includes(query))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(query) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(query) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b);
      })
      .slice(0, 6);

    setSuggestions(matches);
  };

  const saveRecentSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const updated = [
      trimmed,
      ...recentSearches.filter(
        (item) => item.toLowerCase() !== trimmed.toLowerCase()
      ),
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const runSearch = (overrideQuery?: string) => {
    const params = new URLSearchParams();
    const finalQuery = overrideQuery ?? searchTerm;

    if (finalQuery.trim()) {
      params.set("q", finalQuery.trim());
      saveRecentSearch(finalQuery);
    }

    if (locationFilter.trim()) params.set("location", locationFilter.trim());
    if (categoryFilter.trim()) params.set("category", categoryFilter.trim());
    params.set("sortBy", "newest");

    router.push(`/search?${params.toString()}`);
  };

  const openSearchSheet = () => {
    setDraftSearchTerm(searchTerm);
    setDraftLocationFilter(locationFilter);
    setDraftCategoryFilter(categoryFilter);
    setShowDraftSuggestions(false);
    setSearchSheetOpen(true);
  };

  const applySearchSheet = () => {
    setSearchTerm(draftSearchTerm);
    setLocationFilter(draftLocationFilter);
    setCategoryFilter(draftCategoryFilter);
    setShowDraftSuggestions(false);
    setSearchSheetOpen(false);

    const params = new URLSearchParams();

    if (draftSearchTerm.trim()) {
      params.set("q", draftSearchTerm.trim());
      saveRecentSearch(draftSearchTerm);
    }

    if (draftLocationFilter.trim()) {
      params.set("location", draftLocationFilter.trim());
    }

    if (draftCategoryFilter.trim()) {
      params.set("category", draftCategoryFilter.trim());
    }

    params.set("sortBy", "newest");
    router.push(`/search?${params.toString()}`);
  };

  const filteredListings = [...listings].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  const featuredListings = filteredListings.filter((item) => item.is_featured);
  const latestListings = filteredListings.filter((item) => !item.is_featured);

  const categoryItems = [
    { name: "Dogs", icon: Dog },
    { name: "Cats", icon: Cat },
    { name: "Birds", icon: Bird },
    { name: "Fish", icon: Fish },
    { name: "Rabbits", icon: Rabbit },
    { name: "Horses & Ponies", icon: Bird },
    { name: "Livestock", icon: Beef },
    { name: "Reptiles & Amphibians", icon: Turtle },
    { name: "Pet Supplies", icon: Package },
  ];

  const quickMarketplacePoints = [
    {
      title: "Verified sellers",
      icon: ShieldCheck,
    },
    {
      title: "Secure chat",
      icon: MessageCircle,
    },
    {
      title: "Breeder profiles",
      icon: Users,
    },
    {
      title: "Upcoming litters",
      icon: Sparkles,
    },
  ];

  return (
    <main className="bg-[#f7f7f5] min-h-screen pb-24">
      {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-gray-100 bg-[#f7f7f5]">

          {/* subtle background glow */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-120px] right-[-80px] h-[280px] w-[280px] rounded-full bg-green-100 blur-3xl opacity-40" />
            <div className="absolute bottom-[-100px] left-[-80px] h-[220px] w-[220px] rounded-full bg-yellow-100 blur-3xl opacity-40" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 pt-8 sm:pt-14 pb-8 sm:pb-12">

            {/* TOP BADGE */}
            <div className="flex justify-center sm:justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/90 backdrop-blur px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm">
                <Sparkles size={14} className="text-green-600" />
                Australia-wide pet marketplace
              </div>
            </div>

            {/* HERO CONTENT */}
            <div className="mt-6 max-w-3xl">

              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-gray-900 leading-[1.05]">
                Find your perfect pet across Australia
              </h1>

              <p className="mt-5 text-base sm:text-lg text-gray-600 leading-8 max-w-2xl">
                Browse trusted breeders, verified sellers, upcoming litters,
                and pet supplies — all in one modern marketplace.
              </p>

              {/* SEARCH CARD */}
              <div className="mt-8 rounded-[28px] border border-gray-200 bg-white/95 backdrop-blur shadow-xl p-3 sm:p-4">

                {/* MOBILE SEARCH */}
                <div className="block md:hidden">
                  <button
                    type="button"
                    onClick={openSearchSheet}
                    className="w-full rounded-2xl border border-gray-200 bg-[#f8f8f8] px-4 py-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                        <Search size={18} className="text-gray-500" />
                      </div>

                      <div className="text-left min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {searchTerm.trim()
                            ? searchTerm
                            : "Search pets, breeds or keywords"}
                        </p>

                        <p className="text-xs text-gray-500 truncate mt-1">
                          {locationFilter || "Anywhere in Australia"}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-green-600 text-white px-4 py-2 text-sm font-semibold shadow-sm">
                      Search
                    </div>
                  </button>
                </div>

                {/* DESKTOP SEARCH */}
                <div className="hidden md:grid grid-cols-[1.2fr_0.9fr_0.75fr_auto] gap-3 items-center">

                  {/* SEARCH */}
                  <div className="relative">
                    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-[#f8f8f8] px-4 py-3.5">
                      <Search size={18} className="text-gray-400" />

                      <input
                        type="text"
                        placeholder="Search pets, breeds or keywords"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          buildSuggestions(e.target.value);
                          setShowSuggestions(true);
                        }}
                        className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                      />
                    </div>

                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden z-40">
                        {suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => {
                              setSearchTerm(suggestion);
                              setShowSuggestions(false);
                              runSearch(suggestion);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* LOCATION */}
                  <LocationAutocomplete
                    value={locationFilter}
                    onChange={setLocationFilter}
                    placeholder="Location"
                  />

                  {/* CATEGORY */}
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-[#f8f8f8] px-4 py-3.5 text-sm text-gray-900 outline-none focus:border-green-500"
                  >
                    <option value="">All categories</option>

                    {PET_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  {/* BUTTON */}
                  <button
                    onClick={() => {
                      setShowSuggestions(false);
                      runSearch();
                    }}
                    className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-6 py-3.5 text-sm font-semibold transition shadow-md"
                  >
                    Search
                  </button>
                </div>

                {/* RECENT SEARCHES */}
                {!searchTerm.trim() && recentSearches.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setSearchTerm(item);
                          setShowSuggestions(false);
                          runSearch(item);
                        }}
                        className="rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2 text-sm text-gray-700 transition"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* CATEGORY PILLS */}
              <div className="mt-6 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                {categoryItems.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set("category", cat.name);
                      params.set("sortBy", "newest");
                      router.push(`/search?${params.toString()}`);
                    }}
                    className="shrink-0 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
                  >
                    <cat.icon size={15} />
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* STATS */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">

                {[
                  { label: "Listings", value: "2,400+" },
                  { label: "Verified Breeders", value: "180+" },
                  { label: "Australia Wide", value: "24/7" },
                  { label: "New Listings", value: "Daily" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-xl font-bold text-gray-900">
                      {item.value}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>

      {/* FEATURE STRIP */}
      <section className="bg-[#f7f7f5] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {quickMarketplacePoints.map((point) => (
              <div
                key={point.title}
                className="shrink-0 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-700"
              >
                <point.icon size={14} className="text-green-600" />
                {point.title}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featuredListings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-6 sm:mt-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Featured
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                Featured Pets
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Highlighted listings from sellers across Australia.
              </p>
            </div>

            <Link href="/search?sortBy=newest">
              <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition self-start sm:self-auto">
                View all →
              </button>
            </Link>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {featuredListings.map((item) => (
              <div
                key={item.id}
                className="snap-start min-w-[280px] sm:min-w-[340px] max-w-[340px]"
              >
                <ListingCard item={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* LATEST */}
      <section className="max-w-7xl mx-auto px-4 mt-8 mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
              Latest Listings
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
              Fresh Listings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Newly added pets and pet supplies.
            </p>
          </div>

          <Link href="/search?sortBy=newest">
            <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition self-start sm:self-auto">
              View all →
            </button>
          </Link>
        </div>

        {latestListings.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">
              No listings yet
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Check back soon for new pets and supplies.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {latestListings.slice(0, 6).map((item) => (
              <ListingCard key={item.id} item={item} compact />
            ))}
          </div>
        )}
      </section>

      {/* LOWER DISCOVERY AREA */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-5">
          {/* BREEDER OF THE MONTH */}
          {breederOfTheMonth && (
            <section className="rounded-[30px] border border-yellow-100 bg-gradient-to-br from-[#fff9eb] via-white to-[#f9fbf6] shadow-sm overflow-hidden">
              <div className="p-5 sm:p-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-yellow-200 px-3 py-1.5 text-xs font-semibold text-yellow-700 shadow-sm">
                  <Award size={14} />
                  Breeder of the Month
                </div>

                <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900">
                  {breederOfTheMonth.breeder_name ||
                    breederOfTheMonth.username ||
                    "Featured Breeder"}
                </h2>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-medium">
                    <Star size={12} />
                    Top breeder pick
                  </span>

                  {breederOfTheMonth.breeder_verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-medium">
                      <BadgeCheck size={12} />
                      Verified
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm text-gray-600 leading-7 max-w-2xl">
                  {breederOfTheMonth.breeder_bio ||
                    "A standout breeder this month based on activity, listings, updates, and community engagement."}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white border border-gray-100 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                      Listings
                    </p>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {breederOfTheMonth.listingsCount}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-gray-100 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                      Followers
                    </p>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {breederOfTheMonth.followersCount}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white border border-gray-100 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                      Updates
                    </p>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {breederOfTheMonth.announcementsCount}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <Link href={`/breeders/${breederOfTheMonth.id}`}>
                    <button className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md inline-flex items-center gap-2">
                      View Breeder Profile
                      <ArrowRight size={16} />
                    </button>
                  </Link>

                  <Link href="/upcoming-litters">
                    <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition">
                      Browse Upcoming Litters
                    </button>
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* LATEST BREEDER UPDATES */}
          {latestBreederUpdates.length > 0 && (
            <section className="rounded-[30px] border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-5 sm:p-7">
                <div className="flex items-end justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                      Breeder Updates
                    </p>
                    <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                      Latest Updates
                    </h2>
                  </div>

                  <Link href="/upcoming-litters">
                    <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
                      View all →
                    </button>
                  </Link>
                </div>

                <div className="space-y-3">
                  {latestBreederUpdates.map((post) => {
                    const breederName =
                      post.profiles?.breeder_name ||
                      post.profiles?.username ||
                      "Breeder";

                    return (
                      <Link key={post.id} href={`/breeders/${post.breeder_id}`}>
                        <article className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                              {formatAnnouncementType(post.post_type)}
                            </span>

                            {post.expected_date && (
                              <span className="inline-flex text-xs bg-white text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
                                {formatAnnouncementDate(post.expected_date)}
                              </span>
                            )}
                          </div>

                          <h3 className="mt-3 text-base font-semibold text-gray-900 line-clamp-2">
                            {post.title}
                          </h3>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {breederName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {post.profiles?.breeder_verified
                                  ? "Verified Breeder"
                                  : "Breeder"}
                              </p>
                            </div>

                            <span className="text-xs text-green-600 font-medium">
                              View
                            </span>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Verified sellers</p>
                <p className="text-xs text-gray-500 mt-1">Safer browsing</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <MessageCircle size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Secure chat</p>
                <p className="text-xs text-gray-500 mt-1">In-app messaging</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <Users size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Breeder profiles</p>
                <p className="text-xs text-gray-500 mt-1">More trust signals</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Upcoming litters</p>
                <p className="text-xs text-gray-500 mt-1">Discover earlier</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SELL CTA */}
      <section className="max-w-7xl mx-auto px-4 pb-14">
        <div className="rounded-[28px] overflow-hidden border border-gray-100 bg-white shadow-sm p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                For Sellers
              </p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                Ready to list your pet or supply item?
              </h3>
              <p className="mt-3 text-sm sm:text-base text-gray-600 leading-7">
                Create a listing, upload photos, and connect with interested buyers across Australia.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/create">
                <button className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md">
                  Post Your Listing
                </button>
              </Link>

              <Link href="/upcoming-litters">
                <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition">
                  Browse Upcoming Litters
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY SEARCH */}
      {showStickySearch && (
        <div className="fixed top-16 inset-x-0 z-40 px-4 md:hidden">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={openSearchSheet}
              className="w-full rounded-2xl border border-gray-200 bg-white/95 backdrop-blur shadow-lg px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-gray-600 min-w-0">
                <Search size={16} />
                <span className="text-sm truncate">
                  {searchTerm || "Search pets..."}
                </span>
              </div>

              <span className="text-xs text-gray-500">Filters</span>
            </button>
          </div>
        </div>
      )}

      {/* SEARCH SHEET */}
      {searchSheetOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[90]"
            onClick={() => setSearchSheetOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-[100] bg-white rounded-t-[32px] border-t border-gray-200 shadow-2xl p-5 sm:max-w-2xl sm:left-1/2 sm:-translate-x-1/2 sm:bottom-8 sm:rounded-[32px]">
            <div className="w-12 h-1.5 rounded-full bg-gray-200 mx-auto mb-5 sm:hidden" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Search marketplace</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Find pets, breeders, supplies and upcoming litters.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSearchSheetOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100 transition"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Search
                </label>

                <div className="relative">
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search pets, breeds or keywords"
                      value={draftSearchTerm}
                      onChange={(e) => {
                        setDraftSearchTerm(e.target.value);
                        buildDraftSuggestions(e.target.value);
                        setShowDraftSuggestions(true);
                      }}
                      onFocus={() => {
                        buildDraftSuggestions(draftSearchTerm);
                        if (draftSearchTerm.trim()) setShowDraftSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          setShowDraftSuggestions(false);
                          applySearchSheet();
                        }
                        if (e.key === "Escape") {
                          setShowDraftSuggestions(false);
                        }
                      }}
                      className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>

                  {showDraftSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden z-30">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setDraftSearchTerm(suggestion);
                            setShowDraftSuggestions(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Location
                </label>
                <LocationAutocomplete
                  value={draftLocationFilter}
                  onChange={setDraftLocationFilter}
                  placeholder="Enter location"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Category
                </label>
                <select
                  value={draftCategoryFilter}
                  onChange={(e) => setDraftCategoryFilter(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-500"
                >
                  <option value="">All categories</option>
                  {PET_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {!draftSearchTerm.trim() && recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs font-medium text-gray-500">Recent searches</p>

                    <button
                      type="button"
                      onClick={clearAllRecentSearches}
                      className="text-xs font-medium text-gray-500 hover:text-gray-800 transition"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setDraftSearchTerm(item)}
                        className="rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2 text-sm text-gray-700 transition"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDraftSearchTerm("");
                  setDraftLocationFilter("");
                  setDraftCategoryFilter("");
                }}
                className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 text-sm font-semibold transition"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={applySearchSheet}
                className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-4 py-3 text-sm font-semibold transition shadow-md"
              >
                Search
              </button>
            </div>
          </div>
        </>
      )}

      <Footer />
    </main>
  );
}
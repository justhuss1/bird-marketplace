"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Footer from "@/components/Footer";

import {
  Bird,
  Heart,
  MapPin,
  ShieldCheck,
  MessageCircle,
  Star,
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
  attributes?: Record<string, string> | 
  null;
  user_id?: string;
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
  const [userEmail, setUserEmail] = useState("");
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showStickySearch, setShowStickySearch] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const [latestBreederUpdates, setLatestBreederUpdates] = useState<any[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const scrollCategoriesLeft = () => {
    categoryScrollRef.current?.scrollBy({ left: -220, behavior: "smooth" });
  };

  const scrollCategoriesRight = () => {
    categoryScrollRef.current?.scrollBy({ left: 220, behavior: "smooth" });
  };

  useEffect(() => {
    fetchListings();
    getCurrentUser();
    fetchSavedListings();
    fetchLatestBreederUpdates();

    const storedRecentSearches = localStorage.getItem("recentSearches");
    if (storedRecentSearches) {
      setRecentSearches(JSON.parse(storedRecentSearches));
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickySearch(window.scrollY > 420);
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

  const fetchListings = async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .gt("expires_at", new Date().toISOString())
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

  const getSellerLabel = (item: Listing) => {
    return (
      item.profiles?.breeder_name ||
      item.profiles?.username ||
      "Seller"
    );
  };

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserEmail(user?.email || "");
  };

  const fetchSavedListings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSavedListingIds([]);
      return;
    }

    const { data, error } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    setSavedListingIds((data || []).map((item) => item.listing_id));
  };

  const handleToggleSave = async (
    e: React.MouseEvent,
    listingId: string
  ) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in to save listings.");
      return;
    }

    const isSaved = savedListingIds.includes(listingId);

    if (isSaved) {
      const { error } = await supabase
        .from("saved_listings")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);

      if (error) {
        console.error(error);
        alert("Failed to remove saved listing");
        return;
      }

      setSavedListingIds((prev) => prev.filter((id) => id !== listingId));
    } else {
      const { error } = await supabase.from("saved_listings").insert([
        {
          user_id: user.id,
          listing_id: listingId,
        },
      ]);

      if (error) {
        console.error(error);
        alert("Failed to save listing");
        return;
      }

      setSavedListingIds((prev) => [...prev, listingId]);
    }
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

  const removeRecentSearch = (itemToRemove: string) => {
    const updated = recentSearches.filter(
      (item) => item.toLowerCase() !== itemToRemove.toLowerCase()
    );

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

  const filteredListings = [...listings].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  const featuredListings = filteredListings.filter((item) => item.is_featured);
  const latestListings = filteredListings.filter((item) => !item.is_featured);

  const categoryItems = [
    { name: "Birds", icon: Bird },
    { name: "Cats", icon: Cat },
    { name: "Dogs", icon: Dog },
    { name: "Fish", icon: Fish },
    { name: "Horses & Ponies", icon: Bird },
    { name: "Livestock", icon: Beef },
    { name: "Reptiles & Amphibians", icon: Turtle },
    { name: "Rabbits", icon: Rabbit },
    { name: "Pet Supplies", icon: Package },
  ];

  return (
    <main className="bg-gray-50 min-h-screen pb-24">
      {/* REFRESHED HERO */}
      <section className="relative overflow-hidden bg-[#07111f]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=1800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07111f]/95 via-[#07111f]/88 to-[#07111f]/70" />

        <div className="relative max-w-7xl mx-auto px-4 pt-5 sm:pt-7 lg:pt-10 pb-5 sm:pb-7">
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur mb-4">
              <Sparkles size={14} />
              Australia-wide pet marketplace
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white max-w-3xl">
              Find pets, breeders and supplies fast
            </h1>

            <p className="mt-3 text-sm sm:text-lg text-white/78 max-w-2xl leading-7">
              Browse trusted listings, follow breeders, discover upcoming litters,
              and connect safely through in-app messaging.
            </p>

            {/* Compact search strip */}
            <div className="mt-5 sm:mt-6 rounded-[28px] border border-white/10 bg-white/95 p-3 sm:p-4 shadow-2xl backdrop-blur max-w-4xl">
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
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
                    onFocus={() => {
                      buildSuggestions(searchTerm);
                      if (searchTerm.trim()) setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        setShowSuggestions(false);
                        runSearch();
                      }
                      if (e.key === "Escape") {
                        setShowSuggestions(false);
                      }
                    }}
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowSuggestions(false);
                    const params = new URLSearchParams();
                    if (searchTerm.trim()) params.set("q", searchTerm.trim());
                    if (locationFilter.trim()) params.set("location", locationFilter.trim());
                    if (categoryFilter.trim()) params.set("category", categoryFilter.trim());
                    params.set("sortBy", "newest");
                    router.push(`/search?${params.toString()}`);
                  }}
                  className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-4 sm:px-5 py-3 text-sm font-semibold transition inline-flex items-center gap-2"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </button>
              </div>

              {/* Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="relative">
                  <div className="absolute top-2 left-0 right-0 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden z-30">
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
                </div>
              )}

              {/* Mobile action row */}
              <div className="mt-3 grid grid-cols-2 gap-3 sm:hidden">
                <button
                  onClick={() => {
                    setShowSuggestions(false);
                    runSearch();
                  }}
                  className="rounded-2xl bg-[#07111f] hover:bg-[#0c1a2d] text-white px-4 py-3 text-sm font-semibold transition"
                >
                  Search
                </button>

                <Link href="/create">
                  <button className="w-full rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-4 py-3 text-sm font-semibold transition">
                    Post Listing
                  </button>
                </Link>
              </div>

              {/* Desktop row */}
              <div className="hidden sm:flex mt-3 gap-3">
                <LocationAutocomplete
                  value={locationFilter}
                  onChange={setLocationFilter}
                  placeholder="Location"
                />

                <button
                  onClick={() => {
                    setShowSuggestions(false);
                    runSearch();
                  }}
                  className="rounded-2xl bg-[#07111f] hover:bg-[#0c1a2d] text-white px-5 py-3 text-sm font-semibold transition h-[50px]"
                >
                  Search
                </button>

                <Link href="/create">
                  <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition h-[50px]">
                    Post Listing
                  </button>
                </Link>
              </div>

              {/* Recent searches */}
              {!searchTerm.trim() && recentSearches.length > 0 && (
                <div className="mt-4">
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
                      <div
                        key={item}
                        className="inline-flex items-center rounded-full border border-gray-200 bg-white shadow-sm overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm(item);
                            setShowSuggestions(false);
                            runSearch(item);
                          }}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          {item}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeRecentSearch(item)}
                          className="pr-3 pl-1 py-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
                          aria-label={`Remove ${item} from recent searches`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key chips */}
              <div className="mt-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  <Link href="/upcoming-litters">
                    <button className="shrink-0 inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 px-4 py-2.5 text-sm font-semibold hover:bg-green-100 transition">
                      <Sparkles size={15} />
                      Upcoming Litters
                    </button>
                  </Link>

                  {categoryItems.slice(0, 5).map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => {
                        const params = new URLSearchParams();
                        params.set("category", cat.name);
                        params.set("sortBy", "newest");
                        router.push(`/search?${params.toString()}`);
                      }}
                      className="shrink-0 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                    >
                      <cat.icon size={15} />
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCROLLING FEATURE RIBBON */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 overflow-hidden">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {[
              "Follow Breeders",
              "Upcoming Litters",
              "Verified Sellers",
              "Safe In-App Chat",
              "Featured Listings",
              "Australia-Wide Search",
              "Fast Photo Uploads",
              "Pet Supplies Included",
            ].map((item) => (
              <div
                key={item}
                className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURE PROMO STRIP */}
      <section className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 pt-5 sm:pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-4">
            <Link href="/upcoming-litters">
              <article className="group relative overflow-hidden rounded-[30px] border border-green-100 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 sm:p-7 shadow-sm hover:shadow-xl transition duration-300">
                <div className="absolute top-0 right-0 w-40 h-40 bg-green-100/50 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/90 border border-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 shadow-sm">
                    <Sparkles size={14} />
                    New feature
                  </div>

                  <h2 className="mt-4 text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    Discover upcoming litters before they are listed
                  </h2>

                  <p className="mt-3 text-sm sm:text-base text-gray-600 leading-7 max-w-2xl">
                    Follow breeders, keep track of expected dates, and get ahead of new arrivals before standard listings go live.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full bg-white border border-green-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                      Follow breeders
                    </span>
                    <span className="inline-flex rounded-full bg-white border border-green-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                      Expected dates
                    </span>
                    <span className="inline-flex rounded-full bg-white border border-green-100 px-3 py-1.5 text-xs font-medium text-gray-700">
                      Early discovery
                    </span>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-green-700 group-hover:gap-3 transition-all">
                    Browse Upcoming Litters
                    <ArrowRight size={16} />
                  </div>
                </div>
              </article>
            </Link>

            <Link href="/search?sortBy=newest">
              <article className="group relative overflow-hidden rounded-[30px] border border-gray-100 bg-white p-6 sm:p-7 shadow-sm hover:shadow-xl transition duration-300">
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-blue-50 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700">
                    <ShieldCheck size={14} />
                    Built for trust
                  </div>

                  <h3 className="mt-4 text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                    Breeder profiles make the marketplace feel more trusted
                  </h3>

                  <p className="mt-3 text-sm text-gray-600 leading-7">
                    Buyers can explore breeder pages, see updates, follow programs, and browse active listings in one place.
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                        Profiles
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">
                        Public breeder pages
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-gray-500 font-medium">
                        Updates
                      </p>
                      <p className="mt-2 text-sm font-semibold text-gray-900">
                        Litters & announcements
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 group-hover:gap-3 transition-all">
                    Explore Listings
                    <ArrowRight size={16} />
                  </div>
                </div>
              </article>
            </Link>
          </div>
        </div>
      </section>

      {/* DESKTOP HERO */}
      <section className="hidden sm:block relative overflow-hidden bg-[#07111f]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=1800&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07111f]/95 via-[#07111f]/80 to-[#07111f]/35" />

        <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-10 lg:pt-14 lg:pb-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur mb-4">
              <ShieldCheck size={14} />
              Trusted pet marketplace across Australia
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-white">
              Find your next pet
            </h1>

            <p className="mt-3 text-lg text-white/80 max-w-2xl">
              Browse pets and supplies from verified sellers across Australia.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => runSearch()}
                className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md"
              >
                Browse Listings
              </button>

              <Link href="/create">
                <button className="rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 text-white px-5 py-3 text-sm font-semibold transition">
                  Post a Listing
                </button>
              </Link>

              <Link href="/upcoming-litters">
                <button className="rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 text-white px-5 py-3 text-sm font-semibold transition">
                  Upcoming Litters
                </button>
              </Link>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/95 p-5 shadow-2xl backdrop-blur max-w-4xl">
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_auto] gap-3 items-start">
                <div className="relative">
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
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
                      onFocus={() => {
                        buildSuggestions(searchTerm);
                        if (searchTerm.trim()) setShowSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          setShowSuggestions(false);
                          runSearch();
                        }
                        if (e.key === "Escape") {
                          setShowSuggestions(false);
                        }
                      }}
                      className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>

                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden z-30">
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

                <LocationAutocomplete
                  value={locationFilter}
                  onChange={setLocationFilter}
                  placeholder="Location"
                />

                <button
                  onClick={() => {
                    setShowSuggestions(false);
                    runSearch();
                  }}
                  className="rounded-2xl bg-[#07111f] hover:bg-[#0c1a2d] text-white px-5 py-3 text-sm font-semibold transition h-[50px]"
                >
                  Search
                </button>
              </div>

              {!searchTerm.trim() && recentSearches.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-xs font-medium text-gray-500">
                      Recent searches
                    </p>

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
                      <div
                        key={item}
                        className="inline-flex items-center rounded-full border border-gray-200 bg-white shadow-sm overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm(item);
                            setShowSuggestions(false);
                            runSearch(item);
                          }}
                          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          {item}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeRecentSearch(item)}
                          className="pr-3 pl-1 py-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition"
                          aria-label={`Remove ${item} from recent searches`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={scrollCategoriesLeft}
                    className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  <div
                    ref={categoryScrollRef}
                    className="flex gap-2 overflow-x-auto scrollbar-hide px-0 lg:px-12 py-1"
                  >
                    {categoryItems.map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => {
                          const params = new URLSearchParams();
                          params.set("category", cat.name);
                          params.set("sortBy", "newest");
                          router.push(`/search?${params.toString()}`);
                        }}
                        className="shrink-0 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                      >
                        <cat.icon size={15} />
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={scrollCategoriesRight}
                    className="hidden lg:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      {featuredListings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-3 sm:mt-10 relative z-10">
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
              <Link
                key={item.id}
                href={`/listing/${item.id}`}
                className="snap-start min-w-[280px] sm:min-w-[340px] max-w-[340px]"
              >
                <article className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden">
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        item.image && item.image !== ""
                          ? item.image
                          : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=900"
                      }
                      alt={item.title}
                      className="h-40 sm:h-56 w-full object-cover group-hover:scale-105 transition duration-500"
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

                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-[16px] text-gray-900 line-clamp-2 leading-snug min-h-[42px]">
                      {item.title}
                    </h3>

                    <p className="mt-1.5 text-sm text-gray-500 flex items-center gap-1.5">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
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

                      <span className="inline-flex max-w-full truncate rounded-full bg-green-50 text-green-700 px-2.5 py-1 text-[11px]">
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

      {/* LATEST */}
      <section className="max-w-7xl mx-auto px-4 mt-10 mb-14">
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
                      className="h-36 sm:h-56 w-full object-cover group-hover:scale-105 transition duration-500"
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

                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-[16px] text-gray-900 line-clamp-2 leading-snug min-h-[42px]">
                      {item.title}
                    </h3>

                    <p className="mt-1.5 text-sm text-gray-500 flex items-center gap-1.5">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
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

                      <span className="inline-flex max-w-full truncate rounded-full bg-green-50 text-green-700 px-2.5 py-1 text-[11px]">
                        {item.category || "Pet Listing"}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>

      {latestBreederUpdates.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-10 mb-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-600">
                Breeder Updates
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                Latest Breeder Updates
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Follow breeders to get notified about upcoming litters and new availability.
              </p>
            </div>

            <Link href="/upcoming-litters">
              <button className="text-sm font-medium text-gray-600 hover:text-gray-900 transition self-start sm:self-auto">
                View all →
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {latestBreederUpdates.map((post) => {
              const breederName =
                post.profiles?.breeder_name ||
                post.profiles?.username ||
                "Breeder";

              return (
                <Link key={post.id} href={`/breeders/${post.breeder_id}`}>
                  <article className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                        {formatAnnouncementType(post.post_type)}
                      </span>

                      {post.expected_date && (
                        <span className="inline-flex text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                          {formatAnnouncementDate(post.expected_date)}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-gray-900 line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="mt-3 text-sm text-gray-600 line-clamp-4 leading-7">
                      {post.content}
                    </p>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {breederName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {post.profiles?.breeder_verified ? "Verified Breeder" : "Breeder"}
                        </p>
                      </div>

                      <span className="text-xs text-green-600 font-medium">
                        View profile
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* TRUST - LOWER ON PAGE */}
      <section className="max-w-7xl mx-auto px-4 mb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-2xl border border-green-100 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-white text-green-600 p-2.5 rounded-xl shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Verified Sellers
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-5">
                  Authenticated users for safer transactions.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                <MessageCircle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Secure Messaging
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-5">
                  Chat safely inside the platform.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                <Bird size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Pet-Focused
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-5">
                  Built for pets, animals, and supplies.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-green-50 text-green-600 p-2.5 rounded-xl shrink-0">
                <Star size={20} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  Simple Rehoming
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-5">
                  Easy to buy, sell, and rehome responsibly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SELL CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <div className="rounded-[32px] overflow-hidden bg-[#07111f] text-white shadow-xl p-8 sm:p-10 lg:p-12">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-green-400">
            For Sellers
          </p>

          <h3 className="mt-3 text-2xl sm:text-3xl font-bold leading-tight">
            Ready to list your pet or supply item?
          </h3>

          <p className="mt-4 text-sm sm:text-base text-white/75 max-w-2xl leading-7">
            Create a listing, upload photos, and connect with interested buyers
            across Australia.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link href="/create">
              <button className="rounded-2xl bg-green-600 hover:bg-green-700 text-white px-5 py-3 text-sm font-semibold transition shadow-md">
                Post Your Listing
              </button>
            </Link>

            <Link href="/upcoming-litters">
              <button className="rounded-2xl border border-gray-200 bg-white/10 hover:bg-white/20 text-white px-5 py-3 text-sm font-semibold transition">
                Upcoming Litters
              </button>
            </Link>
          </div>
        </div>
      </section>

      {showStickySearch && (
        <div className="fixed top-16 inset-x-0 z-40 px-4 md:hidden">
          <div className="max-w-7xl mx-auto">
            <div className="mt-3 rounded-2xl border border-gray-200 bg-white/95 backdrop-blur shadow-lg p-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1 rounded-xl bg-gray-50 px-3 py-2.5">
                  <Search size={16} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search pets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        runSearch();
                      }
                    }}
                    className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                  />
                </div>

                <button
                  onClick={() => runSearch()}
                  className="shrink-0 rounded-xl bg-[#07111f] hover:bg-[#0c1a2d] text-white px-4 py-2.5 text-sm font-semibold transition"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
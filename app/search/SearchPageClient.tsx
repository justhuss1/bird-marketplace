"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import {
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  RotateCcw,
  X,
  ChevronDown,
  Crosshair,
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
  attributes?: Record<string, string> | null;
  created_at?: string;
  user_id?: string;
  latitude?: number | null;
  longitude?: number | null;
  expires_at?: string | null;
  is_expired?: boolean | null;
  profiles?: {
    username?: string | null;
    breeder_name?: string | null;
    breeder_verified?: boolean | null;
    is_breeder?: boolean | null;
  } | null;
};



type CategoryField = {
  key: string;
  label: string;
  type?: "text" | "select";
  options?: string[];
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

const RADIUS_OPTIONS = ["", "10", "25", "50", "100", "250"] as const;

const getCategoryFields = (category: string): CategoryField[] => {
  switch (category) {
    case "Dogs":
    case "Cats":
    case "Rabbits":
      return [
        { key: "breed", label: "Breed", type: "text" },
        { key: "age", label: "Age", type: "text" },
        {
          key: "gender",
          label: "Gender",
          type: "select",
          options: ["Male", "Female"],
        },
        {
          key: "vaccinated",
          label: "Vaccinated",
          type: "select",
          options: ["Yes", "No"],
        },
        {
          key: "desexed",
          label: "Desexed",
          type: "select",
          options: ["Yes", "No"],
        },
      ];

    case "Birds":
      return [
        { key: "species", label: "Species / Breed", type: "text" },
        { key: "age", label: "Age", type: "text" },
        {
          key: "gender",
          label: "Gender",
          type: "select",
          options: ["Male", "Female"],
        },
        {
          key: "handRaised",
          label: "Hand Raised",
          type: "select",
          options: ["Yes", "No"],
        },
        {
          key: "cageIncluded",
          label: "Cage Included",
          type: "select",
          options: ["Yes", "No"],
        },
      ];

    case "Fish":
      return [
        { key: "species", label: "Species", type: "text" },
        { key: "tankSize", label: "Tank Size", type: "text" },
        {
          key: "waterType",
          label: "Water Type",
          type: "select",
          options: ["Freshwater", "Saltwater"],
        },
        { key: "age", label: "Age", type: "text" },
      ];

    case "Horses & Ponies":
      return [
        { key: "breed", label: "Breed", type: "text" },
        { key: "age", label: "Age", type: "text" },
        {
          key: "gender",
          label: "Gender",
          type: "select",
          options: ["Male", "Female"],
        },
        { key: "height", label: "Height", type: "text" },
        {
          key: "experienceLevel",
          label: "Experience Level",
          type: "select",
          options: ["Beginner", "Intermediate", "Experienced"],
        },
      ];

    case "Livestock":
      return [
        { key: "animalType", label: "Animal Type", type: "text" },
        { key: "breed", label: "Breed", type: "text" },
        { key: "age", label: "Age", type: "text" },
        { key: "quantity", label: "Quantity", type: "text" },
      ];

    case "Reptiles & Amphibians":
      return [
        { key: "species", label: "Species", type: "text" },
        { key: "age", label: "Age", type: "text" },
        {
          key: "sex",
          label: "Sex",
          type: "select",
          options: ["Male", "Female"],
        },
        {
          key: "enclosureIncluded",
          label: "Enclosure Included",
          type: "select",
          options: ["Yes", "No"],
        },
        { key: "feedingType", label: "Feeding Type", type: "text" },
      ];

    case "Pet Supplies":
      return [
        { key: "itemType", label: "Item Type", type: "text" },
        { key: "brand", label: "Brand", type: "text" },
        {
          key: "condition",
          label: "Condition",
          type: "select",
          options: ["New", "Used"],
        },
      ];

    default:
      return [];
  }
};

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");
  const [radiusKm, setRadiusKm] = useState(searchParams.get("radiusKm") || "");
  const [userLat, setUserLat] = useState<number | null>(
    searchParams.get("userLat") ? Number(searchParams.get("userLat")) : null
  );
  const [userLng, setUserLng] = useState<number | null>(
    searchParams.get("userLng") ? Number(searchParams.get("userLng")) : null
  );
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(
    searchParams.get("useMyLocation") === "true"
  );
  const [gettingLocation, setGettingLocation] = useState(false);

  const [attributeFilters, setAttributeFilters] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith("attr_")) {
        initial[key.replace("attr_", "")] = value;
      }
    });
    return initial;
  });

  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>([]);
  const [showKeywordSuggestions, setShowKeywordSuggestions] = useState(false);
  const keywordBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchListings();
    fetchSavedListings();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        keywordBoxRef.current &&
        !keywordBoxRef.current.contains(event.target as Node)
      ) {
        setShowKeywordSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (q.trim()) params.set("q", q.trim());
    if (location.trim()) params.set("location", location.trim());
    if (category.trim()) params.set("category", category.trim());
    if (minPrice.trim()) params.set("minPrice", minPrice.trim());
    if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());
    if (sortBy.trim()) params.set("sortBy", sortBy.trim());
    if (radiusKm.trim()) params.set("radiusKm", radiusKm.trim());
    if (usingCurrentLocation) params.set("useMyLocation", "true");
    if (userLat !== null) params.set("userLat", String(userLat));
    if (userLng !== null) params.set("userLng", String(userLng));

    Object.entries(attributeFilters).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(`attr_${key}`, value.trim());
      }
    });

    router.replace(`/search?${params.toString()}`);
  }, [
    q,
    location,
    category,
    minPrice,
    maxPrice,
    sortBy,
    radiusKm,
    usingCurrentLocation,
    userLat,
    userLng,
    attributeFilters,
    router,
  ]);

  const fetchListings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Listings fetch error:", error);
      setLoading(false);
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
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, breeder_name, breeder_verified, is_breeder")
      .in("id", userIds);

    if (profileError) {
      console.error("Profiles fetch error:", profileError);
      setListings(listingsData);
      setLoading(false);
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
    setLoading(false);
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

  const getSellerLabel = (item: Listing) => {
    return (
      item.profiles?.breeder_name ||
      item.profiles?.username ||
      "Seller"
    );
  };

  const handleAttributeFilterChange = (key: string, value: string) => {
    setAttributeFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setAttributeFilters({});
  };

  const resetFilters = () => {
    setQ("");
    setLocation("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setRadiusKm("");
    setUserLat(null);
    setUserLng(null);
    setUsingCurrentLocation(false);
    setAttributeFilters({});
    setKeywordSuggestions([]);
    setShowKeywordSuggestions(false);
  };

  const buildKeywordSuggestions = (value: string) => {
    const query = value.toLowerCase().trim();

    if (!query) {
      setKeywordSuggestions([]);
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
      .slice(0, 8);

    setKeywordSuggestions(matches);
  };

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device.");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setUserLat(lat);
        setUserLng(lng);
        setUsingCurrentLocation(true);

        if (!radiusKm) {
          setRadiusKm("50");
        }

        setGettingLocation(false);
      },
      () => {
        alert("Unable to get your location.");
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const clearMyLocation = () => {
    setUserLat(null);
    setUserLng(null);
    setUsingCurrentLocation(false);
    setRadiusKm("");
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (q.trim()) count++;
    if (location.trim()) count++;
    if (category.trim()) count++;
    if (minPrice.trim()) count++;
    if (maxPrice.trim()) count++;
    if (sortBy !== "newest") count++;
    if (radiusKm.trim()) count++;
    if (usingCurrentLocation) count++;
    count += Object.values(attributeFilters).filter((v) => v.trim()).length;
    return count;
  }, [
    q,
    location,
    category,
    minPrice,
    maxPrice,
    sortBy,
    radiusKm,
    usingCurrentLocation,
    attributeFilters,
  ]);

  const filteredListings = useMemo(() => {
    return listings
      .filter((item) => {
        const query = q.toLowerCase().trim();

        const matchesSearch =
          !query ||
          item.title.toLowerCase().includes(query) ||
          item.category?.toLowerCase().includes(query) ||
          Object.values(item.attributes || {}).some((value) =>
            value.toLowerCase().includes(query)
          );

        const matchesLocation =
          !location.trim() ||
          item.location?.toLowerCase().includes(location.toLowerCase());

        const matchesCategory = !category || item.category === category;

        const numericPrice = Number(item.price || 0);
        const matchesMinPrice = !minPrice || numericPrice >= Number(minPrice);
        const matchesMaxPrice = !maxPrice || numericPrice <= Number(maxPrice);

        const matchesAttributes = Object.entries(attributeFilters).every(
          ([key, value]) => {
            if (!value.trim()) return true;
            const listingValue = item.attributes?.[key] || "";
            return listingValue.toLowerCase().includes(value.toLowerCase());
          }
        );

        let matchesRadius = true;

        if (
          userLat !== null &&
          userLng !== null &&
          radiusKm &&
          item.latitude !== null &&
          item.latitude !== undefined &&
          item.longitude !== null &&
          item.longitude !== undefined
        ) {
          const distance = haversineDistanceKm(
            userLat,
            userLng,
            item.latitude,
            item.longitude
          );
          matchesRadius = distance <= Number(radiusKm);
        }

        return (
          matchesSearch &&
          matchesLocation &&
          matchesCategory &&
          matchesMinPrice &&
          matchesMaxPrice &&
          matchesAttributes &&
          matchesRadius
        );
      })
      .sort((a, b) => {
        if (
          userLat !== null &&
          userLng !== null &&
          radiusKm &&
          a.latitude !== null &&
          a.latitude !== undefined &&
          a.longitude !== null &&
          a.longitude !== undefined &&
          b.latitude !== null &&
          b.latitude !== undefined &&
          b.longitude !== null &&
          b.longitude !== undefined &&
          sortBy === "nearest"
        ) {
          const distanceA = haversineDistanceKm(
            userLat,
            userLng,
            a.latitude,
            a.longitude
          );
          const distanceB = haversineDistanceKm(
            userLat,
            userLng,
            b.latitude,
            b.longitude
          );
          return distanceA - distanceB;
        }

        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;

        if (sortBy === "lowest") {
          return Number(a.price || 0) - Number(b.price || 0);
        }

        if (sortBy === "highest") {
          return Number(b.price || 0) - Number(a.price || 0);
        }

        return (
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
        );
      });
  }, [
    listings,
    q,
    location,
    category,
    minPrice,
    maxPrice,
    sortBy,
    radiusKm,
    userLat,
    userLng,
    attributeFilters,
  ]);

  const getDistanceLabel = (item: Listing) => {
    if (
      userLat === null ||
      userLng === null ||
      item.latitude === null ||
      item.latitude === undefined ||
      item.longitude === null ||
      item.longitude === undefined
    ) {
      return null;
    }

    const distance = haversineDistanceKm(
      userLat,
      userLng,
      item.latitude,
      item.longitude
    );

    if (distance < 1) {
      return `${Math.round(distance * 1000)} m away`;
    }

    return `${distance.toFixed(1)} km away`;
  };

  const FilterPanel = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="relative sm:col-span-2 lg:col-span-1" ref={keywordBoxRef}>
          <input
            type="text"
            placeholder="Keyword"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              buildKeywordSuggestions(e.target.value);
              setShowKeywordSuggestions(true);
            }}
            onFocus={() => {
              buildKeywordSuggestions(q);
              if (q.trim()) setShowKeywordSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowKeywordSuggestions(false);
              }
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500"
          />

          {showKeywordSuggestions && keywordSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden z-30">
              {keywordSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setQ(suggestion);
                    setShowKeywordSuggestions(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500"
        >
          <option value="">All Categories</option>
          {PET_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <LocationAutocomplete
          value={location}
          onChange={setLocation}
          placeholder="Location"
        />

        <input
          type="number"
          placeholder="Min $"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500"
        />

        <input
          type="number"
          placeholder="Max $"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500"
        >
          <option value="newest">Newest</option>
          <option value="lowest">Price: Low → High</option>
          <option value="highest">Price: High → Low</option>
          {usingCurrentLocation && <option value="nearest">Nearest</option>}
        </select>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={gettingLocation}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-800 transition disabled:opacity-50"
        >
          <Crosshair size={16} />
          {gettingLocation ? "Locating..." : "Use my location"}
        </button>

        <select
          value={radiusKm}
          onChange={(e) => setRadiusKm(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500"
        >
          <option value="">Any distance</option>
          {RADIUS_OPTIONS.filter(Boolean).map((option) => (
            <option key={option} value={option}>
              Within {option} km
            </option>
          ))}
        </select>

        {usingCurrentLocation ? (
          <button
            type="button"
            onClick={clearMyLocation}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition"
          >
            Clear my location
          </button>
        ) : (
          <div />
        )}
      </div>

      {category && getCategoryFields(category).length > 0 && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {getCategoryFields(category).map((field) =>
            field.type === "select" ? (
              <select
                key={field.key}
                value={attributeFilters[field.key] || ""}
                onChange={(e) =>
                  handleAttributeFilterChange(field.key, e.target.value)
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500"
              >
                <option value="">{field.label}</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                key={field.key}
                type="text"
                placeholder={`Filter by ${field.label}`}
                value={attributeFilters[field.key] || ""}
                onChange={(e) =>
                  handleAttributeFilterChange(field.key, e.target.value)
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500"
              />
            )
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition"
        >
          <RotateCcw size={14} />
          Reset
        </button>

        <button
          onClick={() => setMobileFiltersOpen(false)}
          className="md:hidden inline-flex items-center gap-2 rounded-xl bg-[#07111f] text-white px-4 py-2 text-sm font-medium"
        >
          Show Results
        </button>
      </div>
    </>
  );

  return (
    <main className="bg-gray-50 min-h-screen px-4 py-6 pb-24">
      <div className="max-w-7xl mx-auto">
        <section className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-50 text-green-700 px-3 py-1 text-xs font-medium">
                <Search size={14} />
                Search Results
              </div>

              <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900">
                {q ? `Results for “${q}”` : "Browse Listings"}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                {filteredListings.length} matching listing
                {filteredListings.length === 1 ? "" : "s"}
              </p>
            </div>

            <Link href="/" className="hidden sm:block">
              <button className="rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 px-5 py-3 text-sm font-semibold transition">
                Back to Home
              </button>
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {q && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Search: {q}
              </span>
            )}
            {location && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Location: {location}
              </span>
            )}
            {category && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Category: {category}
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Price: {minPrice || "0"} - {maxPrice || "Any"}
              </span>
            )}
            {radiusKm && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                Within {radiusKm} km
              </span>
            )}
            {usingCurrentLocation && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                Using current location
              </span>
            )}
            {Object.entries(attributeFilters).map(([key, value]) =>
              value ? (
                <span
                  key={key}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                >
                  {key}: {value}
                </span>
              ) : null
            )}
          </div>
        </section>

        <section className="mt-6 md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 shadow-sm"
            >
              <SlidersHorizontal size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="flex-1" />

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none rounded-2xl border border-gray-200 bg-white pl-4 pr-10 py-3 text-sm font-semibold text-gray-800 shadow-sm outline-none"
              >
                <option value="newest">Newest</option>
                <option value="lowest">Price: Low → High</option>
                <option value="highest">Price: High → Low</option>
                {usingCurrentLocation && <option value="nearest">Nearest</option>}
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
            </div>
          </div>

          {mobileFiltersOpen && (
            <div className="mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Filter Results
                </h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-full p-2 hover:bg-gray-50"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>

              <FilterPanel />
            </div>
          )}
        </section>

        <section className="hidden md:block mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={18} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Filter Results
            </h2>
          </div>

          <FilterPanel />
        </section>

        <section className="mt-8">
          <div className="flex items-center gap-2 mb-5">
            <SlidersHorizontal size={18} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Matching Listings
            </h2>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              Loading results...
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
              <h3 className="text-xl font-semibold text-gray-900">
                No listings found
              </h3>
              <p className="text-gray-500 mt-2">
                Try a different keyword, category, location, or filter combination.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredListings.map((item) => {
                const distanceLabel = getDistanceLabel(item);

                return (
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
                          className="h-52 sm:h-56 w-full object-cover group-hover:scale-105 transition duration-500"
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
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
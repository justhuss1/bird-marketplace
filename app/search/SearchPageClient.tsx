"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  RotateCcw,
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

export default function SearchPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest");

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

  useEffect(() => {
    fetchListings();
    fetchSavedListings();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (q.trim()) params.set("q", q.trim());
    if (location.trim()) params.set("location", location.trim());
    if (category.trim()) params.set("category", category.trim());
    if (minPrice.trim()) params.set("minPrice", minPrice.trim());
    if (maxPrice.trim()) params.set("maxPrice", maxPrice.trim());
    if (sortBy.trim()) params.set("sortBy", sortBy.trim());

    Object.entries(attributeFilters).forEach(([key, value]) => {
      if (value.trim()) {
        params.set(`attr_${key}`, value.trim());
      }
    });

    router.replace(`/search?${params.toString()}`);
  }, [q, location, category, minPrice, maxPrice, sortBy, attributeFilters, router]);

  const fetchListings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setListings((data || []) as Listing[]);
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
    setAttributeFilters({});
  };

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

        return (
          matchesSearch &&
          matchesLocation &&
          matchesCategory &&
          matchesMinPrice &&
          matchesMaxPrice &&
          matchesAttributes
        );
      })
      .sort((a, b) => {
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
  }, [listings, q, location, category, minPrice, maxPrice, sortBy, attributeFilters]);

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

            <Link href="/">
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

        <section className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <SlidersHorizontal size={18} className="text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900">Filter Results</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <input
              type="text"
              placeholder="Keyword"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500"
            />

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

            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-green-500"
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
            </select>
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

          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          </div>
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
              {filteredListings.map((item) => (
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
                        className="h-56 w-full object-cover group-hover:scale-105 transition duration-500"
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

                      <button
                        onClick={(e) => handleToggleSave(e, item.id)}
                        className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-full font-medium shadow backdrop-blur transition ${
                          savedListingIds.includes(item.id)
                            ? "bg-red-500 text-white"
                            : "bg-white/90 text-gray-800"
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Heart size={14} />
                          {savedListingIds.includes(item.id) ? "Saved" : "Save"}
                        </span>
                      </button>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-[17px] text-gray-900 line-clamp-1 leading-snug">
                          {item.title}
                        </h3>

                        <span className="text-green-600 font-semibold text-[18px] whitespace-nowrap">
                          ${item.price}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                        <MapPin size={14} />
                        {item.location}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="inline-flex text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                          {item.category || "Pet Listing"}
                        </span>

                        <span className="text-xs text-gray-400">
                          View details
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
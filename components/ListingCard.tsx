"use client";

import Link from "next/link";
import { MapPin, BadgeCheck, Star } from "lucide-react";

type ListingCardProps = {
  item: {
    id: string;
    title: string;
    price: string;
    location: string;
    image: string | null;
    category?: string | null;
    is_featured?: boolean | null;
    status?: "available" | "pending" | "sold" | null;
    profiles?: {
      username?: string | null;
      breeder_name?: string | null;
      breeder_verified?: boolean | null;
      is_breeder?: boolean | null;
    } | null;
  };
  compact?: boolean;
};

export default function ListingCard({
  item,
  compact = false,
}: ListingCardProps) {
  const sellerLabel =
    item.profiles?.breeder_name || item.profiles?.username || "Seller";

  return (
    <Link href={`/listing/${item.id}`}>
      <article className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden">
        <div className="relative overflow-hidden">
          <img
            src={
              item.image && item.image !== ""
                ? item.image
                : "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=900"
            }
            alt={item.title}
            className={`w-full object-cover group-hover:scale-105 transition duration-500 ${
              compact ? "h-36 sm:h-44" : "h-40 sm:h-56"
            }`}
          />

          {item.status === "sold" ? (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
              Sold
            </span>
          ) : item.status === "pending" ? (
            <span className="absolute top-3 left-3 bg-amber-500 text-white text-xs px-3 py-1 rounded-full shadow font-medium">
              Pending
            </span>
          ) : item.is_featured ? (
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
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {item.profiles?.is_breeder && (
              <span className="inline-flex rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[10px] font-semibold">
                Breeder
              </span>
            )}

            {item.profiles?.breeder_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 text-yellow-700 px-2 py-0.5 text-[10px] font-semibold">
                <BadgeCheck size={10} />
                Verified
              </span>
            )}

            {item.profiles?.is_breeder && (
              <span className="text-[11px] text-gray-500 truncate">
                {sellerLabel}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-[16px] text-gray-900 line-clamp-2 leading-snug min-h-[42px]">
            {item.title}
          </h3>

          <p className="mt-1.5 text-sm text-gray-500 flex items-center gap-1.5">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{item.location}</span>
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex max-w-full truncate rounded-full bg-green-50 text-green-700 px-2.5 py-1 text-[11px]">
              {item.category || "Pet Listing"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
import Link from "next/link";
import {
  Bird,
  ShieldCheck,
  MessageCircle,
  Search,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";

const featuredListings = [
  {
    id: 1,
    title: "Budgies",
    price: "$50",
    location: "Perth",
    image:
      "https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?auto=format&fit=crop&w=1200&q=80",
    tag: "Featured",
    category: "Parrots",
  },
  {
    id: 2,
    title: "Cockatiel Pair",
    price: "$180",
    location: "Sydney",
    image:
      "https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=1200&q=80",
    tag: "Verified Seller",
    category: "Cockatiels",
  },
  {
    id: 3,
    title: "Rainbow Lorikeet",
    price: "$220",
    location: "Brisbane",
    image:
      "https://images.unsplash.com/photo-1544923408-75c5cef46f14?auto=format&fit=crop&w=1200&q=80",
    tag: "New",
    category: "Lorikeets",
  },
];

const latestListings = [
  {
    id: 4,
    title: "Indian Ringneck",
    price: "$350",
    location: "Melbourne",
    image:
      "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=80",
    category: "Parrots",
  },
  {
    id: 5,
    title: "Lovebirds",
    price: "$120",
    location: "Adelaide",
    image:
      "https://images.unsplash.com/photo-1520808663317-647b476a81b9?auto=format&fit=crop&w=1200&q=80",
    category: "Lovebirds",
  },
  {
    id: 6,
    title: "Canary",
    price: "$70",
    location: "NSW",
    image:
      "https://images.unsplash.com/photo-1497206365907-f5e630693df0?auto=format&fit=crop&w=1200&q=80",
    category: "Canaries",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1600&q=80"
            alt="Bird hero"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-white/95" />
        </div>

        <div className="relative mx-auto flex min-h-[75vh] max-w-7xl flex-col justify-center px-4 pb-10 pt-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              Trusted bird marketplace across Australia
            </div>

            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Buy, Sell & Rehome Birds Safely
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/90 sm:text-xl">
              Australia’s dedicated marketplace for bird lovers — discover
              healthy birds, connect with verified sellers, and rehome with
              confidence.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="#latest-listings"
                className="inline-flex items-center justify-center rounded-2xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-green-700"
              >
                Browse Listings
              </Link>

              <Link
                href="/create"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Post a Listing
              </Link>
            </div>
          </div>

          <div className="mt-10 max-w-4xl rounded-3xl border border-white/15 bg-white/95 p-4 shadow-2xl backdrop-blur sm:p-5">
            <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_auto]">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by bird type, breed or keyword"
                  className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter suburb, city or state"
                  className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>

              <button className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-black">
                Search
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
              <span className="font-medium text-gray-900">
                Trusted by bird owners across Australia
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Verified users
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Secure messaging
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Bird-focused marketplace
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 text-sm text-gray-700 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <span>Authenticated accounts for a safer experience</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span>Secure in-platform messaging between buyers and sellers</span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4">
            <Bird className="h-5 w-5 text-green-600" />
            <span>Built specifically for birds, not general classifieds</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-600">
              Featured
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Featured Birds
            </h2>
            <p className="mt-2 text-gray-600">
              Hand-picked listings from trusted sellers and popular breeders.
            </p>
          </div>

          <Link
            href="/listings?featured=true"
            className="hidden items-center gap-1 text-sm font-semibold text-gray-900 hover:text-green-600 sm:inline-flex"
          >
            View all featured
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredListings.map((listing) => (
            <Link
              key={listing.id}
              href={`/listing/${listing.id}`}
              className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute left-4 top-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-gray-900 shadow">
                  {listing.tag}
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {listing.title}
                    </h3>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                      {listing.price}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-gray-500">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>

                <div className="mt-4 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  {listing.category}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="latest-listings" className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-green-600">
                Latest listings
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                Fresh Birds Near You
              </h2>
              <p className="mt-2 text-gray-600">
                New birds added by sellers across Australia.
              </p>
            </div>

            <Link
              href="/listings"
              className="hidden items-center gap-1 text-sm font-semibold text-gray-900 hover:text-green-600 sm:inline-flex"
            >
              View all listings
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {latestListings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="group overflow-hidden rounded-3xl bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="h-60 overflow-hidden">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {listing.title}
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {listing.price}
                  </p>

                  <div className="mt-3 flex items-center gap-2 text-gray-500">
                    <MapPin className="h-4 w-4" />
                    <span>{listing.location}</span>
                  </div>

                  <div className="mt-4 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {listing.category}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-green-600">
            Why Bird Marketplace
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Built for bird lovers, not general classifieds
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            A safer, simpler way to buy, sell, and rehome birds with more trust,
            better discovery, and smoother communication.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <ShieldCheck className="h-10 w-10 text-green-600" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Verified Sellers
            </h3>
            <p className="mt-2 text-gray-600">
              Every account is authenticated to help create a safer marketplace
              experience.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <MessageCircle className="h-10 w-10 text-green-600" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Secure Messaging
            </h3>
            <p className="mt-2 text-gray-600">
              Chat directly inside the platform without sharing personal details
              upfront.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <Bird className="h-10 w-10 text-green-600" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Bird-Focused Marketplace
            </h3>
            <p className="mt-2 text-gray-600">
              Find birds faster with categories, location search, and
              bird-specific listings.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <Star className="h-10 w-10 text-green-600" />
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Simple Rehoming
            </h3>
            <p className="mt-2 text-gray-600">
              Whether you’re buying, selling, or rehoming, the process is clear
              and easy.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10">
              <p className="text-sm font-semibold uppercase tracking-wide text-green-400">
                For sellers
              </p>
              <h3 className="mt-3 text-3xl font-bold">
                Ready to find a new home for your bird?
              </h3>
              <p className="mt-4 text-white/75">
                Create a listing, upload photos, and connect with interested
                buyers across Australia.
              </p>
              <Link
                href="/create"
                className="mt-6 inline-flex rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Post Your Listing
              </Link>
            </div>

            <div className="rounded-3xl bg-white/5 p-8 ring-1 ring-white/10">
              <p className="text-sm font-semibold uppercase tracking-wide text-green-400">
                For buyers
              </p>
              <h3 className="mt-3 text-3xl font-bold">
                Looking for the right bird?
              </h3>
              <p className="mt-4 text-white/75">
                Explore featured and newly listed birds from trusted sellers
                near you.
              </p>
              <Link
                href="/listings"
                className="mt-6 inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                Browse Birds
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                <Bird className="h-5 w-5 text-green-600" />
                Bird Marketplace
              </div>
              <p className="mt-1 text-sm text-gray-600">
                A safer, simpler way to buy, sell, and rehome birds in
                Australia.
              </p>
            </div>

            <div className="flex gap-5 text-sm text-gray-600">
              <Link href="/listings" className="hover:text-gray-900">
                Browse
              </Link>
              <Link href="/create" className="hover:text-gray-900">
                Sell
              </Link>
              <Link href="/messages" className="hover:text-gray-900">
                Messages
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#07111f] text-white mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

          {/* BRAND */}
          <div>
            <h2 className="text-xl font-bold">Pet Marketplace</h2>
            <p className="mt-3 text-sm text-white/70 leading-6">
              Australia’s trusted place to buy, sell, and discover pets and pet supplies.
            </p>
          </div>

          {/* ABOUT */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              About
            </h3>

            <div className="mt-4 space-y-2 text-sm text-white/70">
              <Link href="/about" className="block hover:text-white transition">
                About Us
              </Link>
              <Link href="/how-it-works" className="block hover:text-white transition">
                How It Works
              </Link>
              <Link href="/trust-safety" className="block hover:text-white transition">
                Trust & Safety
              </Link>
            </div>
          </div>

          {/* SUPPORT */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              Support
            </h3>

            <div className="mt-4 space-y-2 text-sm text-white/70">
              <Link href="/contact" className="block hover:text-white transition">
                Contact Us
              </Link>
              <Link href="/help" className="block hover:text-white transition">
                Help Centre
              </Link>
              <Link href="/report" className="block hover:text-white transition">
                Report a Listing
              </Link>
            </div>
          </div>

          {/* SELLERS (🔥 strategic) */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/80">
              For Sellers
            </h3>

            <div className="mt-4 space-y-2 text-sm text-white/70">
              <Link href="/create" className="block hover:text-white transition">
                Post a Listing
              </Link>
              <Link href="/upcoming-litters" className="block hover:text-white transition">
                Upcoming Litters
              </Link>
              <Link href="/account" className="block hover:text-white transition">
                Breeder Profiles
              </Link>
            </div>
          </div>

        </div>

        {/* BOTTOM BAR */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Pet Marketplace. All rights reserved.
          </p>

          <div className="flex gap-4 text-xs text-white/60">
            <Link href="/privacy" className="hover:text-white transition">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
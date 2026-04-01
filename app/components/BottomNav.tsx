"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/saved-listings", label: "Saved", icon: "❤️" },
    { href: "/create", label: "Post", icon: "➕" },
    { href: "/messages", label: "Messages", icon: "💬" },
    { href: "/my-listings", label: "My Listings", icon: "👤" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-md md:hidden">
      <div className="grid grid-cols-5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 text-xs transition ${
                isActive ? "text-green-600 font-semibold" : "text-gray-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
import { Suspense } from "react";
import SearchPageClient from "./SearchPageClient";

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="p-4">Loading search...</main>}>
      <SearchPageClient />
    </Suspense>
  );
}
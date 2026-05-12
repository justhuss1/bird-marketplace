"use client";

import { useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const AU_LOCATIONS = [
  "Sydney",
  "Melbourne",
  "Brisbane",
  "Perth",
  "Adelaide",
  "Gold Coast",
  "Newcastle",
  "Canberra",
  "Wollongong",
  "Geelong",
  "Hobart",
  "Townsville",
  "Cairns",
  "Darwin",
  "Toowoomba",
  "Ballarat",
  "Bendigo",
  "Albury",
  "Launceston",
];

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Location",
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    const filtered = AU_LOCATIONS.filter((loc) =>
      loc.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 6);

    setSuggestions(filtered);
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setShow(true);
        }}
        onFocus={() => {
          if (value.trim()) setShow(true);
        }}
        onBlur={() => {
          setTimeout(() => setShow(false), 150);
        }}
        className="w-full rounded-2xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 outline-none"
      />

      {show && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-xl z-30 overflow-hidden">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onChange(item);
                setShow(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
"use client";

import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type FormMessageProps = {
  type: "error" | "success" | "info";
  message: string;
};

export default function FormMessage({
  type,
  message,
}: FormMessageProps) {
  if (!message) return null;

  const styles =
    type === "error"
      ? {
          wrapper: "border-red-200 bg-red-50 text-red-700",
          icon: <AlertCircle size={16} className="shrink-0 mt-0.5" />,
        }
      : type === "success"
      ? {
          wrapper: "border-green-200 bg-green-50 text-green-700",
          icon: <CheckCircle2 size={16} className="shrink-0 mt-0.5" />,
        }
      : {
          wrapper: "border-blue-200 bg-blue-50 text-blue-700",
          icon: <Info size={16} className="shrink-0 mt-0.5" />,
        };

  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${styles.wrapper}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-2">
        {styles.icon}
        <span>{message}</span>
      </div>
    </div>
  );
}

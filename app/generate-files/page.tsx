"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GenerateFilesRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const url = params.get("url");
    const customerName = params.get("customerName") || undefined;
    // Navigate to brand-monitor with Files tab active via hash; prefill will be handled via cross-page navigation not supported here,
    // so we simply route to /brand-monitor and the user can select Files tab.
    router.replace("/brand-monitor#files");
  }, [router, params]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-600">
      Redirecting to Files…
    </div>
  );
}

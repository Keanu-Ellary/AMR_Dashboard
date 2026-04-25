"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 animate-pulse">
        Initializing Research Environment...
      </div>
    </div>
  );
}

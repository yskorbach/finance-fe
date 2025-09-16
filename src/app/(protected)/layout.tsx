"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TOKEN_KEY = "access_token";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      const next = pathname + (search?.toString() ? `?${search.toString()}` : "");
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    // (opcjonalnie) sprawdź exp JWT po stronie klienta
    try {
      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      if (payload?.exp && Date.now() / 1000 > payload.exp) {
        localStorage.removeItem(TOKEN_KEY);
        const next = pathname + (search?.toString() ? `?${search.toString()}` : "");
        router.replace(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      const next = pathname + (search?.toString() ? `?${search.toString()}` : "");
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    setReady(true);
  }, [router, pathname, search]);

  if (!ready) return null; // lub skeleton/spinner

  return <>{children}</>;
}

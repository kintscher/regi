"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { relativeSince } from "./format";

// Two jobs, one tiny client island:
//  1. Auto-refresh the RSC every 60 s via router.refresh(). Client 60 s over
//     the server 30 s data-cache (ADR 0011) guarantees each refresh observes
//     data revalidated within the last 30 s, while halving client→server
//     churn versus a 30 s loop.
//  2. Tick the visual «vor X Sek.» relative phrase (~every 10 s). It is
//     aria-hidden on purpose: a 10 s-ticking counter inside a live region is
//     screen-reader noise. The accessible freshness signal is the absolute
//     <time> in the aria-live wrapper rendered by the page, which changes
//     only on a real 60 s refresh (same trade-off as the weather RelativeTime).

export function LiveRefresh({ fetchedAt }: { fetchedAt: string }) {
  const router = useRouter();
  const [rel, setRel] = useState("");

  useEffect(() => {
    const refresh = setInterval(() => router.refresh(), 60_000);
    return () => clearInterval(refresh);
  }, [router]);

  useEffect(() => {
    const tick = () => setRel(relativeSince(fetchedAt));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [fetchedAt]);

  if (!rel) return null;
  return (
    <span className="ov__rel" aria-hidden="true">
      <span className="ov__sep">·</span> {rel}
    </span>
  );
}

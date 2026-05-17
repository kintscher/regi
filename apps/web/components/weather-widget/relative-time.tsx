"use client";

import { useEffect, useState } from "react";

// Progressive enhancement only: the absolute <time> rendered by the server is
// the source of truth. This appends a live «vor X …» that the SSR value can't
// give (it would freeze at cache time). Client because it reads the wall clock
// and ticks. No JS → the absolute time still stands alone.

function phrase(iso: string): string {
  const diffMs = Date.now() - Date.parse(iso);
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return "gerade eben";
  if (min < 60) return min === 1 ? "vor 1 Minute" : `vor ${min} Minuten`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? "vor 1 Stunde" : `vor ${h} Stunden`;
  const d = Math.floor(h / 24);
  return d === 1 ? "vor 1 Tag" : `vor ${d} Tagen`;
}

export function RelativeTime({ iso }: { iso: string }) {
  // Start empty so SSR and first client paint agree (no hydration mismatch);
  // fill in after mount, then keep it honest once a minute.
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => setLabel(phrase(iso));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [iso]);
  if (!label) return null;
  return <span className="weather__rel">{label}</span>;
}

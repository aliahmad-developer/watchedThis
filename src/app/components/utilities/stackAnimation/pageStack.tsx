// app/components/utilities/stackAnimation/pageStack.tsx
"use client";

import { motion, animate } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useIsMobile from "../../hooks/isMobile";

interface StackEntry {
  pathname: string;
  children: React.ReactNode;
}

// Global stack lives outside the component so it survives re-renders
const pageStackHistory: StackEntry[] = [];

export default function PageStack({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const isMobile   = useIsMobile();
  const topRef     = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const existingIndex = pageStackHistory.findIndex(e => e.pathname === pathname);

    if (existingIndex !== -1) {
      // ── GOING BACK ──────────────────────────────────────────────
      // Animate the top page out, then pop it
      const topEl = topRef.current;
      if (topEl && isMobile) {
        animate(topEl, 
          { y: "100%", scale: 0.95, borderRadius: "24px" },
          { ease: [0.32, 0.72, 0, 1], duration: 0.45 }
        ).then(() => {
          pageStackHistory.splice(existingIndex + 1);
          forceUpdate(n => n + 1);
        });
      } else {
        animate(topEl!, 
          { opacity: 0, scale: 0.97 },
          { duration: 0.2 }
        ).then(() => {
          pageStackHistory.splice(existingIndex + 1);
          forceUpdate(n => n + 1);
        });
      }
      return;
    }

    // ── GOING FORWARD ────────────────────────────────────────────
    // Just push, no animation
    pageStackHistory.push({ pathname, children });
    forceUpdate(n => n + 1);

  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the current children fresh in the top entry
  useEffect(() => {
    const top = pageStackHistory[pageStackHistory.length - 1];
    if (top?.pathname === pathname) {
      top.children = children;
      forceUpdate(n => n + 1);
    }
  }, [children, pathname]);

  return (
    <div className="relative min-h-screen bg-light-bg dark:bg-dark-bg overflow-hidden">
      {pageStackHistory.map((entry, i) => {
        const isTop = i === pageStackHistory.length - 1;
        return (
          <div
            key={entry.pathname}
            ref={isTop ? topRef : undefined}
            style={{
              position: i === 0 ? "relative" : "absolute",
              inset: 0,
              zIndex: i,
              // Pages underneath are slightly scaled back (the iOS "stack" look)
              transform: isTop ? undefined : `scale(${0.95 - (pageStackHistory.length - 1 - i) * 0.02})`,
              transformOrigin: "top center",
              borderRadius: isTop ? undefined : "16px",
              overflow: isTop ? undefined : "hidden",
            }}
            className="w-full min-h-screen bg-light-bg dark:bg-dark-bg"
          >
            {entry.children}
          </div>
        );
      })}
    </div>
  );
}
// app/components/utilities/stackAnimation/pageStack.tsx
"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import useIsMobile from "../../hooks/isMobile";

const mobileVariants: Variants = {
  initial: { opacity: 1, scale: 1, y: 0, borderRadius: "0px" },
  animate: { opacity: 1, scale: 1, y: 0, borderRadius: "0px" },
  exit: {
    scale: 0.88,
    y: "110%",
    borderRadius: "24px",
    transition: {
      ease: [0.32, 0.72, 0, 1] as [number, number, number, number],
      duration: 0.5,
    },
  },
};

const desktopVariants: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.2 } },
};

export default function PageStack({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Navigation API — only supported in Chrome 102+
    if (typeof window === "undefined" || !("navigation" in window)) return;

    const nav = (window as any).navigation;

    const handler = (e: any) => {
      // Only intercept back/forward traversals, not regular pushes
      if (e.navigationType !== "traverse") return;
      // Only intercept if going back (delta is negative)
      if (e.destination.index >= nav.currentEntry.index) return;

      const container = containerRef.current;
      if (!container || !isMobile) return;

      // Block the instant navigation
      e.intercept({
        async handler() {
          // Run exit animation FIRST
          await container.animate(
            [
              { transform: "scale(1) translateY(0)",    borderRadius: "0px"  },
              { transform: "scale(0.88) translateY(0)", borderRadius: "24px" },
              { transform: "scale(0.88) translateY(110%)", borderRadius: "24px" },
            ],
            {
              duration: 500,
              easing: "cubic-bezier(0.32, 0.72, 0, 1)",
              fill: "forwards",
            }
          ).finished;
          // Navigation completes after animation
        },
      });
    };

    nav.addEventListener("navigate", handler);
    return () => nav.removeEventListener("navigate", handler);
  }, [isMobile]);

  return (
    <div className="relative min-h-screen bg-light-bg dark:bg-dark-bg overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          ref={containerRef}
          key={pathname}
          variants={isMobile ? mobileVariants : desktopVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ transformOrigin: "top center" }}
          className="w-full bg-light-bg dark:bg-dark-bg"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
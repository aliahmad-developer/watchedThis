"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef, useState, useEffect } from "react";

const variants: Variants = {
  initial: { x: 0 },
  animate: { x: 0 },
  exitBack: {
    x: "100%",
    transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  },
  exitForward: {
    x: 0,
    transition: { duration: 0 },
  },
};

export default function StackTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname   = usePathname();
  const historyRef = useRef<string[]>([pathname]);
  const [displayState, setDisplayState] = useState({
    pathname,
    direction: "forward" as "forward" | "back",
  });

  useEffect(() => {
    if (pathname === displayState.pathname) return;

    const index  = historyRef.current.indexOf(pathname);
    const isBack = index !== -1;

    if (isBack) {
      historyRef.current = historyRef.current.slice(0, index + 1);
    } else {
      historyRef.current.push(pathname);
    }

    setDisplayState({
      pathname,
      direction: isBack ? "back" : "forward",
    });
  }, [pathname]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={displayState.pathname}
          variants={variants}
          initial="initial"
          animate="animate"
          exit={displayState.direction === "back" ? "exitBack" : "exitForward"}
          className="w-full min-h-screen bg-light-bg dark:bg-dark-bg"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
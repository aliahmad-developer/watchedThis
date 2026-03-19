"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function StackTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname  = usePathname();
  const history   = useRef<string[]>([pathname]);
  const direction = useRef<"forward" | "back">("forward");
  const prevPath  = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) return;

    const index = history.current.indexOf(pathname);

    if (index !== -1) {
      direction.current = "back";
      history.current   = history.current.slice(0, index + 1);
    } else {
      direction.current = "forward";
      history.current.push(pathname);
    }

    prevPath.current = pathname;
  }, [pathname]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={pathname}
          initial={{ x: 0 }}
          animate={{ x: 0 }}
          exit={
            direction.current === "back"
              ? { x: "100%", transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] } }
              : { x: 0,      transition: { duration: 0 } }
          }
          className="w-full min-h-screen bg-light-bg dark:bg-dark-bg"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
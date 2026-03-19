// app/components/utilities/stackAnimation/pageStack.tsx
"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useIsMobile from "../../hooks/isMobile";

const mobileVariants: Variants = {
  initial: { x: "100%" },
  animate: {
    x: 0,
    transition: { ease: [0.32, 0.72, 0, 1], duration: 0.35 },
  },
  exit: {
    x: "100%",
    transition: { ease: [0.32, 0.72, 0, 1], duration: 0.35 },
  },
};

const desktopVariants: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, scale: 0.97, transition: { duration: 0.2 } },
};

type Direction = "forward" | "back";

export default function PageStack({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname();
  const isMobile     = useIsMobile();
  const prevPathname = useRef(pathname);
  const history      = useRef<string[]>([pathname]);
  const [direction, setDirection] = useState<Direction>("forward");

  useEffect(() => {
    if (pathname === prevPathname.current) return;

    const existingIndex = history.current.indexOf(pathname);

    if (existingIndex !== -1) {
      // Going back — pathname already in history
      setDirection("back");
      history.current = history.current.slice(0, existingIndex + 1);
    } else {
      // Going forward — new pathname
      setDirection("forward");
      history.current.push(pathname);
    }

    prevPathname.current = pathname;
  }, [pathname]);

  // On back: slide current page out to the right
  // On forward: no enter animation, just appear
  const variants: Variants = isMobile
    ? {
        initial: direction === "forward"
          ? { x: 0 }           // forward = just appear, no slide in
          : { x: 0 },          // back = already in place
        animate: {
          x: 0,
          transition: { ease: [0.32, 0.72, 0, 1], duration: 0.35 },
        },
        exit: direction === "forward"
          ? { x: 0, transition: { duration: 0 } }  // forward exit = instant (going away forward)
          : {
              x: "100%",                            // back exit = slide right
              transition: { ease: [0.32, 0.72, 0, 1], duration: 0.4 },
            },
      }
    : desktopVariants;

  return (
    <div className="relative min-h-screen bg-light-bg dark:bg-dark-bg overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={pathname}
          variants={variants}
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
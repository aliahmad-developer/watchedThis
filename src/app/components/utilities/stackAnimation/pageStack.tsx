// app/components/utilities/stackAnimation/pageStack.tsx
"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
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
      duration: 0.55,
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

  return (
    <div className="relative min-h-screen bg-light-bg dark:bg-dark-bg overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
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
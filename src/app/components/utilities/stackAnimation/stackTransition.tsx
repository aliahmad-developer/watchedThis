"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function StackTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.2, ease: "easeOut" } }}
        className="w-full min-h-screen bg-light-bg dark:bg-dark-bg"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
// app/components/utilities/stackAnimation/pageStack.tsx
"use client";

import { motion, AnimatePresence, type Variants, useMotionValue, useTransform } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
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

// Threshold in px — how far down the user must drag to trigger back
const DRAG_THRESHOLD = 120;

function MobileScreen({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const router = useRouter();
  const y = useMotionValue(0);

  // As the user drags down, scale the screen back slightly (feels native)
  const scale = useTransform(y, [0, 300], [1, 0.92]);
  const borderRadius = useTransform(y, [0, 80], ["0px", "24px"]);

  return (
    <motion.div
      key={pathname}
      variants={mobileVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      drag="y"
      dragDirectionLock
      dragConstraints={{ top: 0, bottom: 0 }}  // elastic feel, snaps back if not enough
      dragElastic={{ top: 0, bottom: 0.4 }}
      style={{ y, scale, borderRadius, transformOrigin: "top center", touchAction: "pan-x" }}
      className="w-full bg-light-bg dark:bg-dark-bg"
      onDragEnd={(_, info) => {
        if (info.offset.y > DRAG_THRESHOLD || info.velocity.y > 500) {
          router.back();
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export default function PageStack({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  return (
    <div className="relative min-h-screen bg-light-bg dark:bg-dark-bg overflow-hidden">
      <AnimatePresence mode="popLayout">
        {isMobile ? (
          <MobileScreen key={pathname} pathname={pathname}>
            {children}
          </MobileScreen>
        ) : (
          <motion.div
            key={pathname}
            variants={desktopVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ transformOrigin: "top center" }}
            className="w-full bg-light-bg dark:bg-dark-bg"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// hooks/useInfiniteScroll.ts
import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll({
  fetchMore,
  hasMore,
  loading,
}: {
  fetchMore: () => void;
  hasMore: boolean;
  loading: boolean;
}) {
  const observerTarget = useRef<HTMLDivElement>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target.isIntersecting && hasMore && !loading) {
        fetchMore();
      }
    },
    [fetchMore, hasMore, loading]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver]);

  return { observerTarget };
}
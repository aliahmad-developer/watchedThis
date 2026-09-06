"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DiceRoll from "./[token]/diceRoll";

export default function RandomPage() {
  
  const router = useRouter();
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/randomCall", { cache: "no-store" });
        const json = await res.json();
        const data = Array.isArray(json) ? json[0] : json;

        const signRes = await fetch("/api/randomCall/sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: data.id,
            media_type: data.media_type,
            title: data.title || data.name || "",
          }),
        });

        const { token } = await signRes.json();

        setFinishing(true);
        setTimeout(() => router.replace(`/random/${token}`), 400);
      } catch {
        router.replace("/");
      }
    };

    run();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <DiceRoll finishing={finishing} />
    </div>
  );
}

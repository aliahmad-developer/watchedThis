"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import {
  faCheckCircle,
  faTriangleExclamation,
  faEnvelopeCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import toast from "react-hot-toast";

export default function ConfirmedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    const toastId = toast.loading("Verifying...", {
      style: {
        borderRadius: "16px",
        background: "var(--color-dark-card)",
        color: "var(--color-dark-body-text)",
        border: "1px solid var(--color-dark-border)",
      },
    });

    (async () => {
      const customToken = searchParams.get("token");
      const redirect = searchParams.get("redirect") ?? "/user/profile";

      if (!customToken) {
        if (!cancelled) {
          const message = "This link is invalid or has expired.";

          setError(message);
          setStatus("error");

          toast.error(message, {
            id: toastId,
            style: {
              borderRadius: "16px",
              background: "var(--color-dark-card)",
              color: "#ffb4b4",
              border: "1px solid rgba(255,0,0,0.15)",
            },
          });
        }

        return;
      }

      try {
        const firebaseConfig = await import("../../firebase/firebaseConfig");

        const auth = await firebaseConfig.getFirebaseAuth();

        await signInWithCustomToken(auth, customToken);

        if (!cancelled) {
          setStatus("success");

          toast.success("Verified!", {
            id: toastId,
            style: {
              borderRadius: "16px",
              background: "var(--color-dark-card)",
              color: "var(--color-dark-body-text)",
              border: "1px solid var(--color-accent)",
            },
          });

          setTimeout(() => {
            router.replace(
              redirect + (redirect.includes("?") ? "&" : "?") + "verified=true",
            );
          }, 1800);
        }
      } catch (e: any) {
        if (!cancelled) {
          const message =
            e?.message ??
            "Something went wrong. Try again or request a new link.";

          setError(message);
          setStatus("error");

          toast.error(message, {
            id: toastId,
            style: {
              borderRadius: "16px",
              background: "var(--color-dark-card)",
              color: "#ffb4b4",
              border: "1px solid rgba(255,0,0,0.15)",
            },
          });
        }
      }
    })();

    return () => {
      cancelled = true;
      toast.dismiss();
    };
  }, [router, searchParams]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-light-bg px-4 py-10 transition-colors duration-300 dark:bg-dark-bg">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 -top-30 h-80 w-[320px] -translate-x-1/2 rounded-full bg-(--color-accent-muted) blur-3xl" />
        <div className="absolute -bottom-30 -right-15 h-65 w-65 rounded-full bg-(--color-accent-muted) blur-3xl" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-4xl border border-light-border bg-light-card/80 shadow-[0_10px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl transition-all duration-300 dark:border-dark-border dark:bg-dark-card/70 dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        {/* Accent Top Border */}
        <div className="h-1.5 w-full bg-(--color-accent)" />

        <div className="p-8 sm:p-10">
          <div className="flex flex-col items-center text-center">
            {/* Icon */}
            <div
              className={`mb-6 flex h-24 w-24 items-center justify-center rounded-full border text-4xl shadow-lg transition-all duration-500 ${
                status === "loading"
                  ? "border-(--color-accent) bg-(--color-accent-muted) text-(--color-accent)"
                  : status === "success"
                    ? "border-(--color-accent) bg-(--color-accent-muted) text-(--color-accent)"
                    : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {status === "loading" && (
                <FontAwesomeIcon
                  icon={faEnvelopeCircleCheck}
                  className="animate-pulse"
                />
              )}

              {status === "success" && (
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="animate-[pop_0.4s_ease]"
                />
              )}

              {status === "error" && (
                <FontAwesomeIcon icon={faTriangleExclamation} />
              )}
            </div>

            {/* Title */}
            <h1 className="mb-3 text-3xl font-bold tracking-tight text-light-header dark:text-dark-header">
              {status === "loading" && "One moment..."}
              {status === "success" && "You're in!"}
              {status === "error" && "That didn't work"}
            </h1>

            {/* Description — only meaningful on error since loading/success are a flash */}
            <p className="mb-8 max-w-sm text-sm leading-relaxed text-light-secondary-text dark:text-dark-secondary-text">
              {status === "loading" && "Verifying your email."}
              {status === "success" && "Taking you to your profile."}
              {status === "error" &&
                (error || "Something went wrong. Try again or head back home.")}
            </p>

            {/* Loader */}
            {status === "loading" && (
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-color-accent [animation-delay:-0.3s]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-color-accent [animation-delay:-0.15s]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-color-accent" />
              </div>
            )}

            {/* Success State */}
            {status === "success" && (
              <div className="rounded-2xl border border-color-accent bg-(--color-accent-muted) px-5 py-3 text-sm text-color-accent">
                ✓ Done
              </div>
            )}

            {/* Error Button — only state they actually read */}
            {status === "error" && (
              <button
                onClick={() => router.push("/")}
                className="rounded-2xl bg-light-btn-bg px-6 py-3 text-sm font-semibold text-light-btn-text transition-all duration-300 hover:underline hover:bg-light-btn-hover-bg dark:bg-dark-btn-bg dark:text-dark-btn-text dark:hover:bg-dark-btn-hover-bg"
              >
                Go back home
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback, FormEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/random", label: "Random" },
  { href: "/spinner", label: "Spinner" },
  { href: "/find", label: "Find" },
  { href: "/echo", label: "Echo" },
];

const CURRENT_YEAR = new Date().getFullYear();
const VERSION = "v5.0.12";

export default function Footer() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState({ name: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [is404, setIs404] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () =>
      setIs404(document.documentElement.dataset.page === "404");
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-page"],
    });
    return () => observer.disconnect();
  }, []);

  const nameError = useMemo(() => {
    return touched.name && name.length === 0
      ? "It'd be nice to know your name."
      : "";
  }, [touched.name, name]);

  const handleNameBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, name: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!name.trim()) {
        toast.error("Please enter your name before submitting.");
        setTouched({ name: true });
        return;
      }
      if (!message.trim()) {
        toast.error("Please enter a message before submitting.");
        return;
      }
      setIsSubmitting(true);
      const toastId = toast.loading("Sending your feedback...");
      try {
        const res = await axios.post("https://formspree.io/f/myznddbj", {
          name,
          email,
          message,
        });
        if (res.status === 200) {
          toast.success("Thank you for your feedback!", { id: toastId });
          setName("");
          setEmail("");
          setMessage("");
          setTouched({ name: false });
        } else {
          toast.error("Something went wrong. Please try again later.", {
            id: toastId,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to send feedback. Check your connection.", {
          id: toastId,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [name, email, message],
  );

  if (is404) return null;

  if (!mounted) {
    return (
      <footer className="cursor-default bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text m-4 border border-light-border dark:border-dark-border rounded-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-light-secondary-text dark:text-dark-secondary-text text-sm">
            © {CURRENT_YEAR} RandoMovie. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="cursor-default bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text m-4 border border-light-border dark:border-dark-border rounded-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10">

        {/* Main grid — proportional columns so form gets more room */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_0.7fr_1.6fr] gap-6 lg:gap-10">

          {/* Creator */}
          <div className="space-y-2.5">
            <h3 className="text-base font-bold text-light-header dark:text-dark-header">
              Creator
            </h3>
            <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm leading-relaxed">
              Made by{" "}
              <span className="text-light-accent dark:text-dark-accent inline">
                Missy & Tiba
              </span>
              . Always improving and open to feedback.
            </p>
          </div>

          {/* Support */}
          <div className="space-y-2.5">
            <h3 className="text-base font-bold text-light-header dark:text-dark-header">
              Support RandoMovie
            </h3>
            <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm leading-relaxed">
              This website is ad-free. You're a visitor, not a customer. If you
              are able, consider supporting our work.
            </p>
            <Link
              href="/about"
              className="inline-block text-sm text-light-accent dark:text-dark-accent hover:opacity-80 transition-opacity"
            >
              Learn more about who you're supporting →
            </Link>
          </div>

          {/* Navigation */}
          <div className="space-y-2.5">
            <h3 className="text-base font-bold text-light-header dark:text-dark-header">
              Navigation
            </h3>
            <ul className="space-y-1.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Feedback */}
          <div className="space-y-2.5">
            <h3 className="text-base font-bold text-light-header dark:text-dark-header">
              Feedback
            </h3>
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg rounded-md text-sm text-light-body-text dark:text-dark-body-text placeholder-light-secondary-text dark:placeholder-dark-secondary-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors"
              />
              {nameError && (
                <p className="text-xs text-light-accent dark:text-dark-accent italic">
                  {nameError}
                </p>
              )}
              <input
                id="email"
                autoComplete="email"
                type="email"
                placeholder="Your email (optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg rounded-md text-sm text-light-body-text dark:text-dark-body-text placeholder-light-secondary-text dark:placeholder-dark-secondary-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors"
              />
              <textarea
                placeholder="Goblins, goblins, goblins..."
                rows={3}
                id="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border leading-relaxed rounded-md text-sm text-light-body-text dark:text-dark-body-text placeholder-light-secondary-text dark:placeholder-dark-secondary-text resize-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                  *Please be kind and help improve the website.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="font-irish-grover shrink-0 px-4 py-2 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send message"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-7 pt-5 border-t border-light-border dark:border-dark-border">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            {/* Legal blurb */}
            <div className="space-y-1.5 max-w-md">
              <h4 className="font-medium text-sm text-light-header dark:text-dark-header">
                Legal
              </h4>
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text leading-relaxed">
                All movies and series names, images, and content are copyrighted
                content of their respective license holders. I do not own the
                rights to any of these media types. All information is compiled
                from TMDB.
              </p>
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                Usage of this website agrees user to the{" "}
                <Link
                  href="/terms"
                  className="hover:text-light-accent dark:hover:text-dark-accent transition-colors duration-200 underline underline-offset-2"
                >
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="hover:text-light-accent dark:hover:text-dark-accent transition-colors duration-200 underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            {/* Right side meta */}
            <div className="flex flex-col sm:items-end gap-1 text-xs text-light-secondary-text dark:text-dark-secondary-text sm:text-right">
              <p>{VERSION}</p>
              <Link
                href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-light-accent dark:hover:text-dark-accent transition-colors underline underline-offset-2"
              >
                Creative Commons BY-NC-SA 4.0 License
              </Link>
              <p>© {CURRENT_YEAR} RandoMovie. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
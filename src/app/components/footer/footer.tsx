"use client";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback, FormEvent } from "react";
import axios from "axios";
import toast from "react-hot-toast";
// Static data that doesn't change
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/random", label: "Random" },
  { href: "/spinner", label: "Spinner" },
  { href: "/find", label: "Find" },
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

  // Only render dynamic parts after client mount
  useEffect(() => {
    setMounted(true);
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
  [name, email, message]
);


  if (!mounted) {
    // Return a simplified version for SSR to prevent hydration mismatch
    return (
      <footer className="cursor-default bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text m-4 border border-light-border dark:border-dark-border rounded-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <p className="text-light-secondary-text dark:text-dark-secondary-text">
              © {CURRENT_YEAR} RandoMovie. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="cursor-default bg-light-card dark:bg-dark-card text-light-body-text dark:text-dark-body-text m-4 border border-light-border dark:border-dark-border rounded-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Main Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Creator Info */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-light-header dark:text-dark-header">
              Creator
            </h3>
            <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm sm:text-base">
              Made by{" "}
              <span className="text-light-accent dark:text-dark-accent inline">
                Missy & Tiba
              </span>
              <span className="text-light-secondary-text dark:text-dark-secondary-text inline">
                .
              </span>{" "}
              Always improving and open to feedback.
            </p>
          </div>

          {/* Support Section */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-light-header dark:text-dark-header">
              Support RandoMovie
            </h3>
            <p className="text-light-secondary-text dark:text-dark-secondary-text text-sm sm:text-base">
              This website is ad-free. You're a visitor, not a customer. If you
              are able, consider supporting our work.
            </p>
            <Link
              href="/about"
              className="inline-block text-sm sm:text-base text-light-accent dark:text-dark-accent hover:opacity-80 transition-opacity"
            >
              Learn more about who you're supporting →
            </Link>
          </div>

          {/* Navigation */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-light-header dark:text-dark-header">
              Navigation
            </h3>
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent transition-colors text-sm sm:text-base"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Feedback Form */}
          <div className="space-y-3 sm:space-y-4 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-light-header dark:text-dark-header">
              Feedback
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                onBlur={handleNameBlur}
                className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg rounded-md text-sm sm:text-base text-light-body-text dark:text-dark-body-text placeholder-light-secondary-text dark:placeholder-dark-secondary-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors"
              />
              {nameError && (
                <p className="mt-1 text-xs sm:text-sm text-light-accent dark:text-dark-accent italic">
                  {nameError}
                </p>
              )}
              <input
                id="email"
                autoComplete="email"
                type="email"
                placeholder="Your email (optional)"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg rounded-md text-sm sm:text-base text-light-body-text dark:text-dark-body-text placeholder-light-secondary-text dark:placeholder-dark-secondary-text border border-light-border dark:border-dark-border focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors"
              />
              <textarea
                placeholder="Goblins, goblins, goblins..."
                rows={3}
                id="text"
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setMessage(e.target.value)
                }
                className="w-full px-3 py-2 min-h-10 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border leading-relaxed rounded-md text-sm sm:text-base text-light-body-text dark:text-dark-body-text placeholder-light-secondary-text dark:placeholder-dark-secondary-text resize-none overflow-y-auto focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent outline-none transition-colors"
              />
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                *Please be kind and help improve the website.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-md transition-colors text-sm sm:text-base bg-light-btn-bg dark:bg-dark-btn-bg text-light-btn-text dark:text-dark-btn-text hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg hover:text-light-btn-hover-text dark:hover:text-dark-btn-hover-text disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>
        </div>

        {/* Legal & Copyright */}
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-light-border dark:border-dark-border">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-2 text-center sm:text-left">
              <h4 className="font-medium text-sm sm:text-base text-light-header dark:text-dark-header">
                Legal
              </h4>
              <p className="text-xs sm:text-sm text-light-secondary-text dark:text-dark-secondary-text">
                All movies and series names, images, and content are copyrighted
                content of their respective license holders. I do not own the
                rights to any of these media types. All information is compiled
                from Tmdb.
              </p>
              <p className="text-xs sm:text-sm text-light-secondary-text dark:text-dark-secondary-text">
                Usage of website agrees user to{" "}
                <Link
                  className="hover:text-light-accent dark:hover:text-dark-accent transition-colors duration-200"
                  href={"/terms"}
                >
                  Terms of Use.
                </Link>
              </p>
            </div>
            <div className="space-y-2 text-center sm:text-right text-xs sm:text-sm text-light-secondary-text dark:text-dark-secondary-text">
              <p>{VERSION}</p>
              <p>
                <Link
                  href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-light-accent dark:hover:text-dark-accent transition-colors underline"
                >
                  Creative Commons BY-NC-SA 4.0 License
                </Link>
              </p>
              <p>© {CURRENT_YEAR} RandoMovie. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

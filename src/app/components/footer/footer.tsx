"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Footer() {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [mounted, setMounted] = useState(false);
  const year = new Date().getFullYear();

  // Only render dynamic parts after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // prevents hydration mismatch

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
                Missy.
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
              are able, consider supporting my work.
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
              {[
                { href: "/", label: "Home" },
                { href: "/random", label: "Random" },
                { href: "/spinner", label: "Spinner" },
                { href: "/find", label: "Find" },
              ].map((link) => (
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
            <form className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setTouched(true)}
                className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md text-sm sm:text-base text-light-body-text dark:text-dark-body-text placeholder-light-secondary-text dark:placeholder-dark-secondary-text"
              />
              {touched && name.length === 0 && (
                <p className="mt-1 text-xs sm:text-sm text-light-accent dark:text-dark-accent italic">
                  It'd be nice to know your name.
                </p>
              )}
              <input
                type="email"
                placeholder="Your email (optional)"
                className="w-full px-3 py-2 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md text-sm sm:text-base text-light-body-text dark:text-dark-body-text placeholder-light-secondary-text dark:placeholder-dark-secondary-text"
              />
              <textarea
                placeholder="Goblins, goblins, goblins.."
                rows={3}
                className="w-full px-3 py-2 min-h-10 
                 bg-light-bg dark:bg-dark-bg 
                 border border-light-border dark:border-dark-border leading-relaxed
                 rounded-md text-sm sm:text-base 
                 text-light-body-text dark:text-dark-body-text 
                 placeholder-light-secondary-text dark:placeholder-dark-secondary-text 
                 resize-none overflow-y-auto"
              />
              <p className="text-xs text-light-secondary-text dark:text-dark-secondary-text">
                *Please be kind and help improve the website.
              </p>
              <button
                type="submit"
                className="px-4 py-2 rounded-md transition-colors text-sm sm:text-base bg-light-btn-bg dark:bg-dark-btn-bg text-light-btn-text dark:text-dark-btn-text hover:bg-light-btn-hover-bg dark:hover:bg-dark-btn-hover-bg hover:text-light-btn-hover-text dark:hover:text-dark-btn-hover-text"
              >
                Send message
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
              <p>v5.0.12</p>
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
              <p>© {year} RandoMovie. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

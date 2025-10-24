"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthPage from "../../components/auth/authPage";

export default function Page() {
  const pathname = usePathname();

  const links = [
    { href: "/user/profile", label: "Profile" },
    { href: "/user/liked", label: "Liked" },
    { href: "/user/worth-watching", label: "Worth Watching" },
  ];

  return (
    // page-level container controls total height
    <div className="flex flex-col min-h-screen bg-light-bg dark:bg-dark-bg">
      {/* Top navigation bar */}
      <nav className="w-full bg-light-bg dark:bg-dark-bg border-b border-gray-300 dark:border-gray-700 shadow-sm">
        <ul className="flex items-center justify-center gap-8 h-16 px-4 text-base font-medium">
          {links.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`transition-colors ${
                    isActive
                      ? "text-light-accent dark:text-dark-accent"
                      : "text-light-secondary-text dark:text-dark-secondary-text hover:text-light-accent dark:hover:text-dark-accent"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="flex-grow min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {" "}
          {/* keeps form width predictable */}
          <AuthPage />
        </div>
      </main>
    </div>
  );
}

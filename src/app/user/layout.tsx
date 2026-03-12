"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const links = [
    { href: "/user/profile", label: "Profile" },
    { href: "/user/library",   label: "Library"   },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-light-bg dark:bg-dark-bg">
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
      <main className="grow px-4 py-8">
        {children}
      </main>
    </div>
  );
}
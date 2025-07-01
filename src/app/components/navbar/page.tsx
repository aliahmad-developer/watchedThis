// components/Navbar.js
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import {
  faShuffle,
  faSpinner,
  faHouse,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import Toggle from "../toggle";

export default function Navbar() {
  const navItems = [
    { icon: faHouse, label: "Home", href: "/" },
    { icon: faMagnifyingGlass, label: "Find", href: "/find" },
    { icon: faShuffle, label: "Random", href: "/random" },
    { icon: faSpinner, label: "Spinner", href: "/spinner" },
  ];

  return (
    <nav
      className="w-full bg-light-nav dark:bg-dark-nav p-2"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center max-w-2xl mx-auto w-full">
        <div className="flex-1">
          <ul className="flex items-center justify-around shadow-md rounded-lg border-2 border-dark-accent dark:bg-dark-border">
            {navItems.map((item, index) => (
              <li key={index} className="group">
                <Link href={item.href} aria-label={item.label}>
                  <div className="flex flex-col items-center px-3 py-1 sm:px-4 sm:py-2 transition-all duration-200 group-hover:text-dark-accent cursor-pointer">
                    <FontAwesomeIcon
                      icon={item.icon}
                      className="text-dark-accent h-6 mb-1 group-hover:scale-110 transition-transform min-w-[24px]"
                    />
                    <span className="text-sm whitespace-nowrap">
                      {item.label}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="ml-4 min-w-[40px] flex items-center justify-center">
          <Toggle />
        </div>
      </div>
    </nav>
  );
}

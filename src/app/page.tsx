"use client"; // Add this at the top to make it a Client Component

import Toggle from "./components/toggle";
import { useTheme } from "next-themes";
import "./globals.css";

export default function Home() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <>
      <div>
        <Toggle />
      </div>
    </>
  );
}

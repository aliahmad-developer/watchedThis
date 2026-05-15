import { Metadata } from "next";
import NotFound from "./NotFoundClient";

export const metadata: Metadata = {
  title: "404 — Page Not Found | WatchedThis",
  description: "This page doesn't exist. Head back and discover movies and TV shows on WatchedThis.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "404 — Page Not Found | WatchedThis",
    description: "This page doesn't exist. Head back and discover movies and TV shows on WatchedThis.",
    type: "website",
  },
};

export default function NotFoundPage() {
  return <NotFound />;
}
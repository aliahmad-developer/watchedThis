import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Random Movie – Test Your Luck | WatchedThis",
  description:
    "Feeling adventurous? Hit the button and let fate decide your next watch. A completely random movie or series pick — no overthinking, just press and watch.",
  openGraph: {
    title: "Random Movie – Test Your Luck | WatchedThis",
    description:
      "Stop scrolling and let fate decide. Hit the button for a completely random movie pick.",
    url: "https://watchedthis.com/random",
    siteName: "WatchedThis",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Random Movie – Test Your Luck | WatchedThis",
    description: "Stop scrolling. Let fate pick your next movie. 🎲",
  },
};
export default function RandomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

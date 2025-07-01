// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-light-bg text-dark-text dark:bg-dark-bg dark:text-light-text p-6">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="mb-6 text-center">Sorry, the page you’re looking for doesn’t exist.</p>
      <Link href="/" className="text-dark-accent hover:underline">
        Go back home
      </Link>
    </div>
  );
}

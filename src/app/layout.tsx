import "./globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "../lib/fontawesome";
import ClientProviders from "./components/utilities/clientProvider/clientProvider";
import BackButton from "./components/utilities/backButton";
import Navbar from "./components/navbar/page";
import Footer from "./components/footer/footer";

export const metadata = {
  title: "RandoMovie.com",
  description: "Discover movies and TV shows randomly",
};

export const viewport = { scrollRestoration: "manual" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="bg-light-bg text-dark-text dark:bg-dark-bg dark:text-light-text transition-colors duration-300 min-h-screen">
        <ClientProviders>
          <Navbar />
          <div className="relative">
            <div className="absolute top-2 left-3 z-40">
              <BackButton />
            </div>
            <div>{children}</div>
          </div>
          <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}
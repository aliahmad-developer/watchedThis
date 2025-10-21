import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/navbar/page";
import PushUp from "./components/utilities/pushUp";
import Footer from "./components/footer/footer";

export const metadata = {
  title: "RandoMovie.com",
};
export const viewport = {
  scrollRestoration: "manual",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Move these inside <head> */}
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="bg-light-bg text-dark-text dark:bg-dark-bg dark:text-light-text transition-colors duration-300 min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <div>{children}</div>
          <Footer />
        </ThemeProvider>
        <PushUp />
        <Toaster
          position="bottom-center"
          gutter={10}
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: "0.75rem",
              padding: "0.75rem 1rem",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
              background: "light-card",
              color: "light-accent",
              border: "1px solid light-border",
              transition: "all 0.3s ease-in-out",
            },
            className:
              "dark:bg-dark-card dark:text-dark-accent dark:border-dark-border",

            // ✅ Success Toast
            success: {
              iconTheme: {
                primary: "dark-accent",
                secondary: "dark-card",
              },
              style: {
                background: "light-card",
                color: "light-accent",
                border: "1px solid light-border",
              },
              className:
                "dark:bg-dark-card dark:text-dark-accent dark:border-dark-border",
            },
            error: {
              iconTheme: {
                primary: "#d9534f",
                secondary: "dark-card",
              },
              style: {
                background: "light-card",
                color: "light-accent",
                border: "1px solid light-border",
              },
              className:
                "dark:bg-dark-card dark:text-dark-accent dark:border-dark-border",
            },
          }}
        />
      </body>
    </html>
  );
}

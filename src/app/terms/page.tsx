import { Metadata } from "next";
import Breadcrumbs from "@/breadCrumb/seo/Breadcrumbs";
import TermsPage from "./termsPage";


export const metadata: Metadata = {
  title: "Terms of Use, WatchedThis",
  description: "Terms of use for WatchedThis.",
};

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Terms of Use | WatchedThis</h1>
      <Breadcrumbs
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Terms of Use", href: "/terms" },
        ]}
      />
      <TermsPage />
    </>
  );
}



import { Metadata } from "next";
import Breadcrumbs from "@/breadCrumb/seo/Breadcrumbs";
import PrivacyPolicyPage from "./privacyPage";


export const metadata: Metadata = {
  title: "Privacy Policy — WatchedThis",
  description: "How WatchedThis collects, uses, and protects your data.",
};

export default function Page() {
  return (
    <>
      <h1 className="sr-only">Privacy Policy — WatchedThis</h1>
      <Breadcrumbs
        crumbs={[
          { name: "Home", href: "/" },
          { name: "Privacy Policy", href: "/privacy" },
        ]}
      />
      <PrivacyPolicyPage />
    </>
  );
}



import { Metadata } from "next";
import PrivacyPolicyPage from "./privacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy — WatchedThis",
  description: "How WatchedThis collects, uses, and protects your data.",
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
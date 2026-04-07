import { Metadata } from "next";
import PrivacyPolicyPage from "./privacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy — RandoMovie",
  description: "How RandoMovie collects, uses, and protects your data.",
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
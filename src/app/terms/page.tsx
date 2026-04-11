import { Metadata } from "next";
import TermsPage from "./termsPage";

export const metadata: Metadata = {
  title: "Terms of Use, RandoMovie",
  description: "Terms of use for RandoMovie.",
};

export default function Page() {
  return <TermsPage />;
}
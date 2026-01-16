import type { Metadata } from "next";
import { LotReviewScreen } from "../../../_components";

export const metadata: Metadata = {
  title: "Lot Review",
  description: "Review lot details, documents, and approval actions.",
};

export default function LotReviewPage() {
  return <LotReviewScreen />;
}

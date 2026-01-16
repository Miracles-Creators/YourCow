import type { Metadata } from "next";
import { SettlementsReviewScreen } from "../../_components";

export const metadata: Metadata = {
  title: "Settlements",
  description: "Review settlement outcomes for completed lots.",
};

export default function SettlementsPage() {
  return <SettlementsReviewScreen />;
}

import type { Metadata } from "next";
import { UpdatesReviewScreen } from "../../_components";

export const metadata: Metadata = {
  title: "Updates Review",
  description: "Verify and flag operational updates from producers.",
};

export default function UpdatesReviewPage() {
  return <UpdatesReviewScreen />;
}

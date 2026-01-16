import type { Metadata } from "next";
import { ProducerDetailScreen } from "../../../_components";

export const metadata: Metadata = {
  title: "Producer Review",
  description: "Review producer details, documents, and onboarding status.",
};

export default function ProducerDetailPage() {
  return <ProducerDetailScreen />;
}

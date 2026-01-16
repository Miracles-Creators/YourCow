import type { Metadata } from "next";
import { ProducersListScreen } from "../../_components";

export const metadata: Metadata = {
  title: "Producers",
  description: "Review and manage producer onboarding status.",
};

export default function ProducersPage() {
  return <ProducersListScreen />;
}

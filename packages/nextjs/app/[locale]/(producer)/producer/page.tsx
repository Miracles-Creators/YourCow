import type { Metadata } from "next";
import { ProducerDashboardScreen } from "../_components";

export const metadata: Metadata = {
  title: "Producer Dashboard",
};

export default function ProducerDashboardPage() {
  return <ProducerDashboardScreen />;
}

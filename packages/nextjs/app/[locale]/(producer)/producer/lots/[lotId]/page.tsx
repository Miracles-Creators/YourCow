import type { Metadata } from "next";
import { ProducerLotDashboardScreen } from "../../../_components";

export const metadata: Metadata = {
  title: "Manage Lot",
};

export default function ProducerLotDashboardPage() {
  return <ProducerLotDashboardScreen />;
}

import type { Metadata } from "next";
import { DashboardScreen } from "../_components/screens/DashboardScreen";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your cattle investment portfolio overview and performance metrics.",
};

export default function DashboardPage() {
  return <DashboardScreen />;
}

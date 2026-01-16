import type { Metadata } from "next";
import { AdminDashboardScreen } from "../../_components";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Operational overview and review queues",
};

export default function AdminDashboardPage() {
  return <AdminDashboardScreen />;
}

import type { Metadata } from "next";
import { LotsListScreen } from "../../_components";

export const metadata: Metadata = {
  title: "Lots",
  description: "Review and manage cattle investment lots.",
};

export default function LotsPage() {
  return <LotsListScreen />;
}

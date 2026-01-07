import type { Metadata } from "next";
import { MarketplaceScreen } from "../_components/screens/MarketplaceScreen";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Browse available cattle investment lots with detailed information and funding progress.",
};

export default function MarketplacePage() {
  return <MarketplaceScreen />;
}

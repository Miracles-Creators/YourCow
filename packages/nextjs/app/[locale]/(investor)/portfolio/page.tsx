import type { Metadata } from "next";
import { PortfolioScreen } from "../_components/screens/PortfolioScreen";

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Detailed view of your cattle investment portfolio and holdings.",
};

export default function PortfolioPage() {
  return <PortfolioScreen />;
}

import type { Metadata } from "next";
import { LiquidityOverviewScreen } from "../../_components";

export const metadata: Metadata = {
  title: "Liquidity Overview",
  description: "Operational overview of liquidity windows and exits.",
};

export default function LiquidityPage() {
  return <LiquidityOverviewScreen />;
}

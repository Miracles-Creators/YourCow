import type { Metadata } from "next";
import { TradeScreen } from "../_components/screens/TradeScreen";

export const metadata: Metadata = {
  title: "Trade",
  description:
    "Trade cattle lot shares with other investors via fiat or crypto.",
};

export default function TradePage() {
  return <TradeScreen />;
}

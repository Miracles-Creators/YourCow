import type { Metadata } from "next";
import { P2PScreen } from "../_components/screens/P2PScreen";

export const metadata: Metadata = {
  title: "P2P Marketplace",
  description:
    "Trade cattle lot shares with other investors in a transparent marketplace.",
};

export default function P2PPage() {
  return <P2PScreen />;
}

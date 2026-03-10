import type { Metadata } from "next";
import { P2PPrivateBalanceFundScreen } from "../../_components/screens/P2PPrivateBalanceFundScreen";

export const metadata: Metadata = {
  title: "Fund Private Balance",
  description: "Client-only preview of the private balance funding flow.",
};

export default function P2PPrivateBalanceFundPage() {
  return <P2PPrivateBalanceFundScreen />;
}

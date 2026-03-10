import type { Metadata } from "next";
import { P2PMarketplaceV2Screen } from "../_components/screens/P2PMarketplaceV2Screen";

export const metadata: Metadata = {
  title: "P2P Marketplace V2",
  description: "Client-only preview of the private marketplace UX for the privacy track.",
};

export default function P2PMarketplaceV2Page() {
  return <P2PMarketplaceV2Screen />;
}

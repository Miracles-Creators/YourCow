import type { Metadata } from "next";
import { ProducerLotTimelineScreen } from "../../../../_components";

export const metadata: Metadata = {
  title: "Lot Timeline",
};

export default function ProducerLotTimelinePage() {
  return <ProducerLotTimelineScreen />;
}

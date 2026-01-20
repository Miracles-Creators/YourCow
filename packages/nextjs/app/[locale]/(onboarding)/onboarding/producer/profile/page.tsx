import type { Metadata } from "next";
import { ProducerProfileScreen } from "../../../_components/screens/ProducerProfileScreen";

export const metadata: Metadata = {
  title: "Producer Profile",
  description: "Set up your farm profile to start listing cattle lots on YourCow.",
};

export default function ProducerProfilePage() {
  return <ProducerProfileScreen />;
}

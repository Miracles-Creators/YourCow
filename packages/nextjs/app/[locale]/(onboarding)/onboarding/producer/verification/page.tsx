import type { Metadata } from "next";
import { ProducerVerificationScreen } from "../../../_components/screens/ProducerVerificationScreen";

export const metadata: Metadata = {
  title: "Producer Verification",
  description: "Verify your producer registration to start listing cattle lots.",
};

export default function ProducerVerificationPage() {
  return <ProducerVerificationScreen />;
}

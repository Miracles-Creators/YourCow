import type { Metadata } from "next";
import { SupportExceptionsScreen } from "../../_components";

export const metadata: Metadata = {
  title: "Support",
  description: "Support tickets and exception handling queues.",
};

export default function SupportPage() {
  return <SupportExceptionsScreen />;
}

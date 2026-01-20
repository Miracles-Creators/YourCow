import type { Metadata } from "next";
import { InvestorKycScreen } from "../../../_components/screens/InvestorKycScreen";

export const metadata: Metadata = {
  title: "Investor Verification",
  description: "Complete identity verification and risk profile to start investing.",
};

export default function InvestorKycPage() {
  return <InvestorKycScreen />;
}

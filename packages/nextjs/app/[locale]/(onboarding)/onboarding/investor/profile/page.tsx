import type { Metadata } from "next";
import { InvestorProfileScreen } from "../../../_components/screens/InvestorProfileScreen";

export const metadata: Metadata = {
  title: "Investor Profile",
  description: "Complete your investor profile to start investing in cattle lots.",
};

export default function InvestorProfilePage() {
  return <InvestorProfileScreen />;
}

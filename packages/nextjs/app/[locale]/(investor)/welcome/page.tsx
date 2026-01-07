import type { Metadata } from "next";
import { WelcomeScreen } from "../_components/screens/WelcomeScreen";

export const metadata: Metadata = {
  title: "Welcome",
  description:
    "Invest in real cattle assets with structured liquidity aligned with production cycles.",
};

export default function WelcomePage() {
  return <WelcomeScreen />;
}

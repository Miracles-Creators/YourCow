import type { Metadata } from "next";
import { InvestorLayout } from "~~/app/[locale]/(investor)/_components/layouts/InvestorLayout";
import { WelcomeScreen } from "~~/app/[locale]/(investor)/_components/screens/WelcomeScreen";
import { inter, playfair } from "~~/lib/fonts";

export const metadata: Metadata = {
  title: "Welcome",
  description:
    "Invest in real cattle assets with structured liquidity aligned with production cycles.",
};

export default function LocaleHomePage() {
  return (
    <div className={`${inter.variable} ${playfair.variable} font-inter`}>
      <InvestorLayout>
        <WelcomeScreen />
      </InvestorLayout>
    </div>
  );
}

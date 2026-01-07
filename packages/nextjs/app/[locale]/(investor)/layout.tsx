import type { Metadata } from "next";
import { inter, playfair } from "~~/lib/fonts";
import { InvestorLayout } from "./_components/layouts/InvestorLayout";

export const metadata: Metadata = {
  title: {
    template: "%s | YourCow",
    default: "YourCow - Invest in Real Cattle Assets",
  },
  description:
    "Structured liquidity aligned with real production cycles. Invest in verified cattle assets with YourCow.",
  keywords: [
    "cattle investment",
    "agricultural assets",
    "livestock investment",
    "real assets",
    "alternative investments",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "YourCow",
    title: "YourCow - Invest in Real Cattle Assets",
    description:
      "Structured liquidity aligned with real production cycles. Invest in verified cattle assets.",
  },
  twitter: {
    card: "summary_large_image",
    title: "YourCow - Invest in Real Cattle Assets",
    description: "Structured liquidity aligned with real production cycles.",
  },
};

export default function InvestorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${playfair.variable} font-inter`}>
      <InvestorLayout>{children}</InvestorLayout>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvestmentSuccessScreen } from "../../_components/screens/InvestmentSuccessScreen";
import { mockLots } from "../../_constants/mockData";

export const metadata: Metadata = {
  title: "Investment Successful",
  description: "Your cattle investment has been successfully processed.",
};

interface Props {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    amount?: string;
    shares?: string;
  }>;
}

export default async function InvestmentSuccessPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const { amount, shares } = await searchParams;

  // Find the lot
  const lot = mockLots.find((l) => l.id === id);

  if (!lot) {
    notFound();
  }

  // Parse investment details from query params (should come from previous step)
  // In production, these would come from the backend/database
  const investmentAmount = amount ? parseFloat(amount) : 0;
  const sharesAmount = shares ? parseInt(shares, 10) : 0;

  return (
    <InvestmentSuccessScreen
      lot={lot}
      investmentAmount={investmentAmount}
      shares={sharesAmount}
    />
  );
}

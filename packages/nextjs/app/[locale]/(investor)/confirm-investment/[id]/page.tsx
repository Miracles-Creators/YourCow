import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmInvestmentScreen } from "../../_components/screens/ConfirmInvestmentScreen";
import { mockLots } from "../../_constants/mockData";

export const metadata: Metadata = {
  title: "Confirm Investment",
  description: "Review and confirm your cattle investment details.",
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

export default async function ConfirmInvestmentPage({
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

  // Parse investment details from query params
  const investmentAmount = amount ? parseFloat(amount) : 0;
  const sharesAmount = shares ? parseInt(shares, 10) : 0;

  if (!investmentAmount || !sharesAmount) {
    notFound();
  }

  return (
    <ConfirmInvestmentScreen
      lot={lot}
      investmentAmount={investmentAmount}
      shares={sharesAmount}
    />
  );
}

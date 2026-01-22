import type { Metadata } from "next";
import { InvestmentSuccessScreen } from "../../_components/screens/InvestmentSuccessScreen";
import { notFound } from "next/navigation";

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

  // Parse investment details from query params (should come from previous step)
  // In production, these would come from the backend/database
  const investmentAmount = amount ? parseFloat(amount) : 0;
  const sharesAmount = Number(shares ?? 0);

  return (
    <InvestmentSuccessScreen
      lotId={Number(id)}
      investmentAmount={investmentAmount}
      shares={sharesAmount}
    />
  );
}

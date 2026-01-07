import type { Metadata } from "next";
import { getLotById } from "../../_constants/mockData";
import { InvestAmountScreen } from "../../_components/screens/InvestAmountScreen";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const lot = getLotById(id);

  if (!lot) {
    return {
      title: "Lot Not Found",
      description: "The requested cattle investment lot could not be found.",
    };
  }

  return {
    title: `Invest in ${lot.name}`,
    description: `Specify your investment amount for ${lot.name} and see your expected shares and returns.`,
  };
}

export default async function InvestAmountPage({ params }: Props) {
  const { id } = await params;
  return <InvestAmountScreen lotId={id} />;
}

import type { Metadata } from "next";
import { InvestAmountScreen } from "../../_components/screens/InvestAmountScreen";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Invest in Lot ${id}`,
    description:
      "Specify your investment amount and see your expected shares and returns.",
  };
}

export default async function InvestAmountPage({ params }: Props) {
  const { id } = await params;
  return <InvestAmountScreen lotId={Number(id)} />;
}

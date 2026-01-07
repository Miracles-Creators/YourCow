import type { Metadata } from "next";
import { getLotById } from "../../_constants/mockData";
import { LotDetailScreen } from "../../_components/screens/LotDetailScreen";

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
    title: lot.name,
    description: `Invest in ${lot.name}. ${lot.duration} duration, ${lot.expectedReturn} expected return. Located in ${lot.location}.`,
  };
}

export default async function LotDetailPage({ params }: Props) {
  const { id } = await params;
  return <LotDetailScreen lotId={id} />;
}

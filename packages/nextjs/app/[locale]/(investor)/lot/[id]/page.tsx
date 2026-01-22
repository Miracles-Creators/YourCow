import type { Metadata } from "next";
import { LotDetailScreen } from "../../_components/screens/LotDetailScreen";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Lot ${id}`,
    description:
      "Review details of this investment lot, including returns, duration, and pricing.",
  };
}

export default async function LotDetailPage({ params }: Props) {
  const { id } = await params;
  return <LotDetailScreen lotId={Number(id)} />;
}

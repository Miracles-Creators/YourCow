import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PositionDetailScreen } from "../../_components/screens/PositionDetailScreen";
import { getPositionById } from "../../_constants/mockData";

export const metadata: Metadata = {
  title: "Position Detail",
  description: "View your investment position details, NAV evolution, and production metrics.",
};

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function PositionDetailPage({ params }: Props) {
  const { id } = await params;

  // Find the position
  const position = getPositionById(id);

  if (!position) {
    notFound();
  }

  return <PositionDetailScreen positionId={id} />;
}

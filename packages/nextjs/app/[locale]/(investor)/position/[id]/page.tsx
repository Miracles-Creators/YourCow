import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PositionDetailScreen } from "../../_components/screens/PositionDetailScreen";

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
  const lotId = Number(id);

  if (isNaN(lotId) || lotId <= 0) {
    notFound();
  }

  return <PositionDetailScreen lotId={lotId} />;
}

import type { Metadata } from "next";
import { CreateLotDocumentsScreen } from "../../../../_components";

export const metadata: Metadata = {
  title: "Create Lot – Documents",
};

export default function CreateLotDocumentsPage() {
  return <CreateLotDocumentsScreen />;
}

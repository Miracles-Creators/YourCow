import type { Metadata } from "next";
import { CreateLotBasicInfoScreen } from "../../../_components";

export const metadata: Metadata = {
  title: "Create Lot – Basic Info",
};

export default function CreateLotBasicInfoPage() {
  return <CreateLotBasicInfoScreen />;
}

import type { Metadata } from "next";
import { RoleSelectionScreen } from "../../_components/screens/RoleSelectionScreen";

export const metadata: Metadata = {
  title: "Choose Role",
  description: "Select how you want to use YourCow - as an investor or producer.",
};

export default function RoleSelectionPage() {
  return <RoleSelectionScreen />;
}

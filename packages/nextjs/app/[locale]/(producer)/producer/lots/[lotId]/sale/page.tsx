import type { Metadata } from "next";
import { RegisterSaleEventScreen } from "../../../../_components";

export const metadata: Metadata = {
  title: "Register Sale",
};

export default function RegisterSaleEventPage() {
  return <RegisterSaleEventScreen />;
}

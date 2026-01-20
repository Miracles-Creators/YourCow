import type { Metadata } from "next";
import { inter, playfair } from "~~/lib/fonts";
import { OperatorLayout } from "./_components/layouts/OperatorLayout";
import { ProducerAuthGate } from "./_components/ProducerAuthGate";

export const metadata: Metadata = {
  title: {
    template: "%s | YourCow",
    default: "YourCow - Producer Console",
  },
  description: "Manage cattle lots, updates, and sale events with YourCow.",
};

export default function OperatorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${playfair.variable} font-inter`}>
      <ProducerAuthGate>
        <OperatorLayout>{children}</OperatorLayout>
      </ProducerAuthGate>
    </div>
  );
}

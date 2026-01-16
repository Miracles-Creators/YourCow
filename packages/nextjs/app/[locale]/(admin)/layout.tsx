import type { Metadata } from "next";
import { inter, playfair } from "~~/lib/fonts";
import { AdminLayout } from "./_components/layouts/AdminLayout";

export const metadata: Metadata = {
  title: {
    template: "%s | YourCow",
    default: "YourCow - Admin Console",
  },
  description: "Operate approvals, reviews, and risk queues with YourCow.",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${playfair.variable} font-inter`}>
      <AdminLayout>{children}</AdminLayout>
    </div>
  );
}

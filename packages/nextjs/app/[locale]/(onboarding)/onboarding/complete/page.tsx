import type { Metadata } from "next";
import { OnboardingCompleteScreen } from "../../_components/screens/OnboardingCompleteScreen";

export const metadata: Metadata = {
  title: "Onboarding Complete",
  description:
    "Your YourCow account setup is complete. Start investing or listing cattle lots.",
};

interface Props {
  searchParams: Promise<{ role?: string }>;
}

export default async function OnboardingCompletePage({ searchParams }: Props) {
  const { role } = await searchParams;
  return (
    <OnboardingCompleteScreen
      role={role === "producer" ? "producer" : "investor"}
    />
  );
}

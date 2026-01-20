import type { Metadata } from "next";
import { OnboardingCompleteScreen } from "../../_components/screens/OnboardingCompleteScreen";

export const metadata: Metadata = {
  title: "Onboarding Complete",
  description: "Your YourCow account setup is complete. Start investing or listing cattle lots.",
};

// In a real app, you'd get the role from auth context or URL params
// For now, we default to investor
export default function OnboardingCompletePage() {
  // TODO: Get role from session/context
  // const role = useAuth().user?.role;
  return <OnboardingCompleteScreen role="investor" />;
}

import type { Metadata } from "next";
import { RegisterScreen } from "../_components/screens/RegisterScreen";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a YourCow account to begin onboarding and access real cattle investment opportunities.",
};

export default function RegisterPage() {
  return <RegisterScreen />;
}

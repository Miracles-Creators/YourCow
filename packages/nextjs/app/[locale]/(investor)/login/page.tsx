import type { Metadata } from "next";
import { LoginScreen } from "../_components/screens/LoginScreen";

export const metadata: Metadata = {
  title: "Login",
  description: "Secure access to your YourCow investment account. No passwords required.",
};

export default function LoginPage() {
  return <LoginScreen />;
}

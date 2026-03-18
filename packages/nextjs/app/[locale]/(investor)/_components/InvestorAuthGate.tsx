"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useMe } from "~~/hooks/auth/useMe";
import { useRouter } from "~~/lib/i18n/routing";

type InvestorAuthGateProps = {
  children: ReactNode;
};

export function InvestorAuthGate({ children }: InvestorAuthGateProps) {
  const router = useRouter();
  const me = useMe();

  useEffect(() => {
    if (me.isLoading || me.isFetching) return;

    if (me.data?.role === "INVESTOR") return;

    if (me.data?.role === "ADMIN") {
      router.replace("/admin/dashboard");
      return;
    }

    if (me.data?.role === "PRODUCER") {
      router.replace("/onboarding/producer/profile");
      return;
    }

    router.replace("/login");
  }, [me.data?.role, me.isFetching, me.isLoading, router]);

  if (me.isLoading || me.isFetching) return null;

  if (me.data?.role !== "INVESTOR") return null;

  return <>{children}</>;
}

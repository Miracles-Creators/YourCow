"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useMe } from "~~/hooks/auth/useMe";
import { useRouter } from "~~/lib/i18n/routing";

type AdminAuthGateProps = {
  children: ReactNode;
};

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const router = useRouter();
  const me = useMe();
  const [isRevalidating, setIsRevalidating] = useState(true);

  useEffect(() => {
    let isActive = true;

    const revalidate = async () => {
      try {
        await me.refetch();
      } finally {
        if (isActive) {
          setIsRevalidating(false);
        }
      }
    };

    revalidate();

    return () => {
      isActive = false;
    };
  }, [me.refetch]);

  useEffect(() => {
    if (isRevalidating || me.isLoading || me.isFetching) return;

    if (me.data?.role === "ADMIN") {
      return;
    }

    if (me.data?.role === "PRODUCER") {
      router.replace("/producer");
      return;
    }

    if (me.data?.role === "INVESTOR") {
      router.replace("/dashboard");
      return;
    }

    router.replace("/login");
  }, [isRevalidating, me.data?.role, me.isFetching, me.isLoading, router]);

  if (isRevalidating || me.isLoading || me.isFetching) {
    return null;
  }

  if (me.data?.role !== "ADMIN") {
    return null;
  }

  return <>{children}</>;
}

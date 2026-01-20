"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useMe } from "~~/hooks/auth/useMe";
import { useProducerMe } from "~~/hooks/producers/useProducerMe";
import { useRouter } from "~~/lib/i18n/routing";

type ProducerAuthGateProps = {
  children: ReactNode;
};

export function ProducerAuthGate({ children }: ProducerAuthGateProps) {
  const router = useRouter();
  const producerMe = useProducerMe();
  const me = useMe();

  useEffect(() => {
    if (
      producerMe.isLoading ||
      producerMe.isFetching ||
      me.isLoading ||
      me.isFetching
    ) {
      return;
    }

    if (producerMe.data?.user?.role === "PRODUCER") {
      return;
    }

    if (me.data?.role === "PRODUCER") {
      router.replace("/onboarding/producer/profile");
      return;
    }

    if (me.data?.role === "INVESTOR") {
      router.replace("/dashboard");
      return;
    }

    if (me.data?.role === "ADMIN") {
      router.replace("/admin/dashboard");
      return;
    }

    router.replace("/login");
  }, [
    me.data?.role,
    me.isFetching,
    me.isLoading,
    producerMe.data?.user?.role,
    producerMe.isFetching,
    producerMe.isLoading,
    router,
  ]);

  if (
    producerMe.isLoading ||
    producerMe.isFetching ||
    me.isLoading ||
    me.isFetching
  ) {
    return null;
  }

  if (producerMe.data?.user?.role !== "PRODUCER") {
    return null;
  }

  return <>{children}</>;
}

"use client";

import { useTranslations } from "next-intl";
import { BRAND_COPY } from "~~/lib/constants/brand";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { useOnboardingStore } from "~~/services/store/onboarding";
import { CowLogo } from "./Logo";

interface TopBarProps {
  minimal?: boolean;
}

export function TopBar({ minimal = false }: TopBarProps) {
  const t = useTranslations("investor.dashboard");
  const fullName = useOnboardingStore((s) => s.register.fullName);
  const firstName = fullName.split(" ")[0] || "";

  if (minimal) {
    return (
      <header className="flex w-full items-center pb-4 pt-3">
        <div className="flex-shrink-0">
          <CowLogo className="h-8 w-8" />
        </div>
        <div className="ml-auto">
          <CustomConnectButton />
        </div>
      </header>
    );
  }

  return (
    <header className="flex w-full items-center justify-between pb-8 pt-3">
      <div className="flex flex-col items-start">
        <span className="font-playfair text-base font-bold tracking-tight text-vaca-neutral-gray-900">
          {BRAND_COPY.name}
        </span>
        <span className="font-inter text-sm font-medium text-vaca-neutral-gray-500">
          {t("greeting", { name: firstName })}
        </span>
      </div>
      <div className="flex justify-end gap-2">
        <CustomConnectButton />
      </div>
    </header>
  );
}

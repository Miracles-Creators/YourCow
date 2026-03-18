"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "~~/components/LanguageSwitcher";
import { cn } from "~~/lib/utils/cn";
import { InvestorAuthGate } from "../InvestorAuthGate";
import { BottomNav } from "../ui/BottomNav";
import { SideNav } from "../ui/SideNav";
import { TopBar } from "../ui/TopBar";

interface InvestorLayoutProps {
  children: ReactNode;
  className?: string;
}

const PUBLIC_ROUTES = ["/", "/login", "/register"];
const PUBLIC_PREFIXES = ["/lot/"];

// Immersive routes: no TopBar, no padding, no max-w — the screen owns its own layout
const IMMERSIVE_ROUTES = [
  "/lot/",
  "/invest/",
  "/confirm-investment/",
  "/investment-success/",
  "/position/",
];

export function InvestorLayout({ children, className }: InvestorLayoutProps) {
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";
  const isPublicRoute =
    PUBLIC_ROUTES.some((r) => pathWithoutLocale === r || pathWithoutLocale.startsWith(r + "/")) ||
    PUBLIC_PREFIXES.some((p) => pathWithoutLocale.startsWith(p));
  const showBottomNav = !PUBLIC_ROUTES.some(
    (r) => pathWithoutLocale === r || pathWithoutLocale.startsWith(r + "/"),
  );
  const isNarrowCentered = ["/", "/login", "/register"].some(
    (r) => pathWithoutLocale === r || pathWithoutLocale.startsWith(r + "/"),
  );
  const isImmersive = IMMERSIVE_ROUTES.some((r) =>
    pathWithoutLocale.startsWith(r),
  );
  const showFloatingLanguageSwitcher = !showBottomNav || isImmersive;

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-x-hidden bg-vaca-neutral-bg",
        className,
      )}
    >
      {showFloatingLanguageSwitcher && (
        <div
          className={cn(
            "fixed right-4 top-4 z-40",
            showBottomNav && isImmersive && "lg:hidden",
          )}
        >
          <LanguageSwitcher />
        </div>
      )}

      {showBottomNav && <SideNav />}

      <div
        className={cn(
          "relative z-10 flex min-h-screen justify-center",
          isNarrowCentered ? "items-center" : "items-start",
          isImmersive ? "px-0 pb-0" : "px-4 pb-8 sm:px-6 lg:px-8",
          showBottomNav && !isImmersive && "pb-24 lg:pb-8 lg:pl-64",
          showBottomNav && isImmersive && "lg:pl-64",
        )}
      >
        <main
          className={cn(
            "w-full",
            isNarrowCentered && "max-w-md",
            !isNarrowCentered && !isImmersive && "max-w-md lg:max-w-6xl",
          )}
        >
          {showBottomNav && !isImmersive && <TopBar />}
          {isPublicRoute ? children : <InvestorAuthGate>{children}</InvestorAuthGate>}
        </main>
      </div>

      {showBottomNav && <BottomNav />}
    </div>
  );
}

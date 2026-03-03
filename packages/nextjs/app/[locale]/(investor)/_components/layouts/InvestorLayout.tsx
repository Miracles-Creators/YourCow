"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";
import { BottomNav } from "../ui/BottomNav";
import { SideNav } from "../ui/SideNav";
import { TopBar } from "../ui/TopBar";

interface InvestorLayoutProps {
  children: ReactNode;
  className?: string;
}

const PUBLIC_ROUTES = ["/welcome", "/login"];

// Immersive routes: no TopBar, no padding, no max-w — the screen owns its own layout
const IMMERSIVE_ROUTES = ["/lot/", "/invest/", "/confirm-investment/", "/investment-success/", "/position/"];

export function InvestorLayout({ children, className }: InvestorLayoutProps) {
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";
  const showBottomNav = !PUBLIC_ROUTES.some((r) => pathWithoutLocale === r || pathWithoutLocale.startsWith(r + "/"));
  const isNarrowCentered = ["/welcome", "/login", "/register"].some(
    (r) => pathWithoutLocale === r || pathWithoutLocale.startsWith(r + "/"),
  );
  const isImmersive = IMMERSIVE_ROUTES.some((r) => pathWithoutLocale.startsWith(r));

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-x-hidden bg-vaca-neutral-bg",
        className,
      )}
    >
      {showBottomNav && <SideNav />}

      <div
        className={cn(
          "relative z-10 flex min-h-screen justify-center",
          isNarrowCentered ? "items-center" : "items-start",
          isImmersive
            ? "px-0 pb-0"
            : "px-4 pb-8 sm:px-6 lg:px-8",
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
          {children}
        </main>
      </div>

      {showBottomNav && <BottomNav />}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "~~/lib/utils/cn";

interface NavItem {
  label: string;
  href: string;
  icon: (isActive: boolean) => React.ReactNode;
}

/**
 * BottomNav - Mobile-first bottom navigation bar
 * Shows on authenticated investor screens (dashboard, marketplace, etc.)
 */
export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("common.nav");

  const navItems: NavItem[] = [
    {
      label: t("dashboard"),
      href: "/dashboard",
      icon: (isActive) => (
        <svg
          className={cn("h-6 w-6", isActive ? "fill-current" : "fill-none")}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      label: t("marketplace"),
      href: "/marketplace",
      icon: (isActive) => (
        <svg
          className={cn("h-6 w-6", isActive ? "fill-current" : "fill-none")}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      label: t("portfolio"),
      href: "/portfolio",
      icon: (isActive) => (
        <svg
          className={cn("h-6 w-6", isActive ? "fill-current" : "fill-none")}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
  ];

  // Remove locale prefix from pathname (e.g., /en/dashboard -> /dashboard)
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";

  // Check if current path matches nav item
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathWithoutLocale === href;
    }
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-vaca-neutral-gray-200 bg-vaca-neutral-white shadow-lg"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 px-3 py-3 transition-colors",
                "hover:bg-vaca-green/5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vaca-green",
                active
                  ? "text-vaca-green"
                  : "text-vaca-neutral-gray-500 hover:text-vaca-green",
              )}
              aria-current={active ? "page" : undefined}
            >
              {/* Icon */}
              <div className="flex h-6 w-6 items-center justify-center">
                {item.icon(active)}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "font-inter text-xs font-medium",
                  active ? "font-semibold" : "font-normal",
                )}
              >
                {item.label}
              </span>

              {/* Active Indicator */}
              {active && (
                <div className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-t-full bg-vaca-green" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

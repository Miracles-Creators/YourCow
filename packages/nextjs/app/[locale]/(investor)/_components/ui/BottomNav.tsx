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

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("common.nav");

  const navItems: NavItem[] = [
    {
      label: t("home"),
      href: "/dashboard",
      icon: (isActive) => (
        <svg
          className={cn("h-[18px] w-4", isActive ? "fill-current" : "fill-none")}
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
      label: t("invest"),
      href: "/marketplace",
      icon: (isActive) => (
        <svg
          className={cn("h-5 w-[18px]", isActive ? "fill-current" : "fill-none")}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4l-5 5"
          />
        </svg>
      ),
    },
    {
      label: t("trade"),
      href: "/p2p",
      icon: (isActive) => (
        <svg
          className={cn("h-4 w-5", isActive ? "fill-current" : "fill-none")}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 7h8m0 0-3-3m3 3-3 3M17 17H9m0 0 3 3m-3-3 3-3"
          />
        </svg>
      ),
    },
  ];

  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathWithoutLocale === href;
    }
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-vaca-neutral-gray-100 bg-vaca-neutral-white/80 backdrop-blur-md"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto flex max-w-md items-center justify-between px-6 pb-6 pt-2">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-gold",
                active
                  ? "text-vaca-gold"
                  : "text-vaca-neutral-gray-400 hover:text-vaca-neutral-gray-600",
              )}
              aria-current={active ? "page" : undefined}
            >
              <div className="flex items-center justify-center">
                {item.icon(active)}
              </div>
              <span
                className={cn(
                  "font-inter text-[10px] font-bold uppercase tracking-widest",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

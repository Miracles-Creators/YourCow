"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "~~/lib/utils/cn";
import { CowLogo } from "./Logo";
import { BRAND_COPY } from "~~/lib/constants/brand";

interface NavItem {
  label: string;
  href: string;
  icon: (isActive: boolean) => React.ReactNode;
}

export function SideNav() {
  const pathname = usePathname();
  const t = useTranslations("common.nav");
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";

  const navItems: NavItem[] = [
    {
      label: t("home"),
      href: "/dashboard",
      icon: (isActive) => (
        <svg
          className={cn("h-5 w-5", isActive ? "fill-current" : "fill-none")}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
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
          className={cn("h-5 w-5", isActive ? "fill-current" : "fill-none")}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
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
          className={cn("h-5 w-5", isActive ? "fill-current" : "fill-none")}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
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

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathWithoutLocale === href;
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-vaca-neutral-gray-100 bg-vaca-neutral-white/90 backdrop-blur-xl lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 pb-2 pt-6">
        <CowLogo className="h-10 w-10 shrink-0" />
        <span className="font-playfair text-xl font-bold tracking-tight text-vaca-neutral-gray-900">
          {BRAND_COPY.name}
        </span>
      </div>

      <p className="px-6 pb-6 font-inter text-[11px] font-medium tracking-wide text-vaca-neutral-gray-400">
        {BRAND_COPY.tagline}
      </p>

      {/* Divider */}
      <div className="mx-5 border-t border-vaca-neutral-gray-100" />

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5" aria-label="Main navigation">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-gold",
                    active
                      ? "bg-vaca-green/10 text-vaca-green"
                      : "text-vaca-neutral-gray-500 hover:bg-vaca-neutral-gray-50 hover:text-vaca-neutral-gray-800",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {item.icon(active)}
                  <span className={cn(
                    "font-inter text-sm",
                    active ? "font-semibold" : "font-medium",
                  )}>
                    {item.label}
                  </span>
                  {active && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-vaca-green" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-vaca-neutral-gray-100 px-6 py-4">
        <p className="font-inter text-[10px] font-medium uppercase tracking-widest text-vaca-neutral-gray-300">
          {BRAND_COPY.description}
        </p>
      </div>
    </aside>
  );
}

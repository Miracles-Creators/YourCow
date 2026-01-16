"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~~/lib/utils/cn";

interface AdminLayoutProps {
  children: ReactNode;
  className?: string;
}

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Producers", href: "/admin/producers" },
  { label: "Lots", href: "/admin/lots" },
  { label: "Updates", href: "/admin/updates" },
  { label: "Liquidity", href: "/admin/liquidity" },
  { label: "Settlements", href: "/admin/settlements" },
  { label: "Support", href: "/admin/support" },
];

/**
 * Layout for admin backoffice screens.
 * Optimized for dense, operational workflows.
 */
export function AdminLayout({ children, className }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "min-h-screen bg-vaca-neutral-bg text-vaca-neutral-gray-900",
        className,
      )}
    >
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded-full bg-vaca-neutral-white px-4 py-2 text-sm font-semibold text-vaca-blue shadow"
      >
        Skip to content
      </a>

      <div className="flex min-h-screen min-w-0">
        <aside className="hidden w-64 flex-col border-r border-vaca-neutral-gray-100 bg-vaca-neutral-white px-4 py-6 lg:flex">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-vaca-neutral-gray-500">
                Admin
              </p>
              <p className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
                YourCow
              </p>
            </div>
            <span className="rounded-full bg-vaca-green/10 px-3 py-1 text-xs font-semibold text-vaca-green">
              Admin
            </span>
          </div>

          <nav className="mt-8 flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue/40",
                    isActive
                      ? "bg-vaca-blue/10 text-vaca-blue"
                      : "text-vaca-neutral-gray-600 hover:bg-vaca-neutral-gray-50",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-bg p-3 text-xs text-vaca-neutral-gray-500">
            <p className="font-semibold text-vaca-neutral-gray-700">
              Admin user
            </p>
            <p>ops@yourcow.com</p>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-vaca-neutral-gray-100 bg-vaca-neutral-white px-5 py-2 lg:hidden">
            <div className="flex items-center gap-3">
              <p className="font-playfair text-base font-semibold leading-none text-vaca-neutral-gray-900">
                YourCow
              </p>
              <span className="rounded-full bg-vaca-neutral-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-vaca-neutral-gray-600">
                Ops
              </span>
            </div>
          </header>

          <div className="border-b border-vaca-neutral-gray-100 bg-vaca-neutral-white px-5 py-3 lg:hidden">
            <nav className="flex gap-3 overflow-x-auto pb-2">
              {navItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue/40",
                      isActive
                        ? "border-vaca-blue/30 bg-vaca-blue/10 text-vaca-blue"
                        : "border-vaca-neutral-gray-200 text-vaca-neutral-gray-600",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <main
            id="admin-main"
            className="flex-1 px-5 py-6 sm:px-6 lg:px-10"
          >
            <div className="mx-auto w-full max-w-7xl min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

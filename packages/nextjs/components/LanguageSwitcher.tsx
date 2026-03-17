"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "~~/lib/i18n/routing";
import { locales, localeLabels, type Locale } from "~~/lib/i18n/config";
import { cn } from "~~/lib/utils/cn";
import { useEffect } from "react";

interface LanguageSwitcherProps {
  className?: string;
}

const localeShortLabels: Record<Locale, string> = {
  en: "EN",
  es: "ES",
};

/**
 * LanguageSwitcher Component
 * Compact locale control styled as a utility pill for layout chrome.
 */
export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    if (newLocale === locale) {
      return;
    }

    // Save to localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("YourCow-locale", newLocale);
    }
    router.replace(pathname, { locale: newLocale });
  };

  // Save current locale to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("YourCow-locale", locale);
    }
  }, [locale]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-vaca-neutral-gray-200",
        "bg-vaca-neutral-white/90 p-1 shadow-sm backdrop-blur-md",
        className,
      )}
      role="group"
      aria-label="Language selector"
    >
      {locales.map((loc) => {
        const isActive = locale === loc;

        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchLocale(loc)}
            className={cn(
              "rounded-full px-3 py-1.5 font-inter text-[11px] font-semibold uppercase tracking-[0.24em]",
              "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-vaca-green/20",
              isActive
                ? "bg-vaca-green text-vaca-neutral-white shadow-sm"
                : "text-vaca-neutral-gray-500 hover:bg-vaca-neutral-gray-50 hover:text-vaca-neutral-gray-800",
            )}
            aria-pressed={isActive}
            aria-label={localeLabels[loc]}
            title={localeLabels[loc]}
          >
            {localeShortLabels[loc]}
          </button>
        );
      })}
    </div>
  );
}

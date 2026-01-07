"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '~~/lib/i18n/routing';
import { locales, localeLabels, localeFlags, type Locale } from '~~/lib/i18n/config';
import { cn } from '~~/lib/utils/cn';
import { useState, useEffect } from 'react';

/**
 * LanguageSwitcher Component
 * Allows users to switch between Spanish and English
 *
 * Features:
 * - Displays current language with flag
 * - Dropdown with all available languages
 * - Preserves current route when switching
 * - Saves preference to localStorage
 * - Styled to match YourCow brand
 */
export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const switchLocale = (newLocale: Locale) => {
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('YourCow-locale', newLocale);
    }
    router.replace(pathname, { locale: newLocale });
    setIsOpen(false);
  };

  // Save current locale to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('YourCow-locale', locale);
    }
  }, [locale]);

  return (
    <div className="relative">
      {/* Current Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-lg border-2 border-vaca-neutral-gray-200",
          "bg-vaca-neutral-white px-3 py-2",
          "font-inter text-sm font-medium text-vaca-neutral-gray-700",
          "transition-all duration-200",
          "hover:border-vaca-green/30 hover:bg-vaca-neutral-gray-50",
          "focus:outline-none focus:ring-2 focus:ring-vaca-green/20"
        )}
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="text-base">{localeFlags[locale]}</span>
        <span className="hidden sm:inline">{localeLabels[locale]}</span>
        <svg
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div className="absolute right-0 z-20 mt-2 w-40 rounded-lg border-2 border-vaca-neutral-gray-200 bg-vaca-neutral-white shadow-lg">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3",
                  "font-inter text-sm transition-colors duration-150",
                  "first:rounded-t-md last:rounded-b-md",
                  locale === loc
                    ? "bg-vaca-green/10 font-semibold text-vaca-green"
                    : "text-vaca-neutral-gray-700 hover:bg-vaca-neutral-gray-50"
                )}
                aria-current={locale === loc ? "true" : undefined}
              >
                <span className="text-lg">{localeFlags[loc]}</span>
                <span>{localeLabels[loc]}</span>
                {locale === loc && (
                  <svg
                    className="ml-auto h-4 w-4 text-vaca-green"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

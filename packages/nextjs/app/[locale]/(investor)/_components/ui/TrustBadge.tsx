"use client";

import { useTranslations } from 'next-intl';
import { cn } from "~~/lib/utils/cn";

interface TrustBadgeProps {
  message?: string;
  className?: string;
}

export function TrustBadge({
  message,
  className,
}: TrustBadgeProps) {
  const t = useTranslations('brand');
  const displayMessage = message || t('trustBadge');

  return (
    <div
      className={cn(
        "flex items-center gap-2 font-inter text-sm text-vaca-neutral-gray-400",
        className,
      )}
      role="status"
      aria-label={displayMessage}
    >
      {/* Shield/Star Icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M8 1L10.5 5.5L15.5 6.5L11.75 10.5L12.5 15.5L8 13L3.5 15.5L4.25 10.5L0.5 6.5L5.5 5.5L8 1Z"
          fill="currentColor"
          className="text-vaca-blue"
        />
      </svg>
      <span>{displayMessage}</span>
    </div>
  );
}

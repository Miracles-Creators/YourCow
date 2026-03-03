"use client";

import { useTranslations } from "next-intl";
import type { PortfolioSummaryLotDto } from "~~/lib/api/schemas";

interface PortfolioValueChartProps {
  lots: PortfolioSummaryLotDto[];
  totalValue: number;
}

export function PortfolioValueChart({ lots, totalValue }: PortfolioValueChartProps) {
  const t = useTranslations("investor.dashboard.chart");

  if (lots.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="font-inter text-sm text-vaca-neutral-gray-400">{t("noData")}</p>
      </div>
    );
  }

  const mockPoints = generateMockPoints(lots, totalValue);
  const minVal = Math.min(...mockPoints.map((p) => p.value));
  const maxVal = Math.max(...mockPoints.map((p) => p.value));
  const range = maxVal - minVal || 1;
  const padding = range * 0.1;

  const toY = (val: number) =>
    160 - ((val - minVal + padding) / (range + 2 * padding)) * 150;

  const linePath = mockPoints
    .map((p, i) => {
      const x = (i / (mockPoints.length - 1)) * 416;
      const y = toY(p.value);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const areaPath = [
    linePath,
    `L 416 160 L 0 160 Z`,
  ].join(" ");

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-3xl lg:h-full lg:min-h-[10rem]">
      <svg
        className="h-full w-full"
        viewBox="0 0 416 160"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="dashboardChartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B5E20" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1B5E20" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaPath} fill="url(#dashboardChartGradient)" />

        {/* Line */}
        <path
          d={linePath}
          stroke="#1B5E20"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* End dot */}
        {mockPoints.length > 0 && (() => {
          const last = mockPoints[mockPoints.length - 1];
          const y = toY(last.value);
          return <circle cx={416} cy={y} r="4" fill="#1B5E20" />;
        })()}
      </svg>
    </div>
  );
}

function generateMockPoints(
  lots: PortfolioSummaryLotDto[],
  totalValue: number,
): { value: number; label: string }[] {
  const totalInvested = lots.reduce((sum, l) => sum + l.invested, 0);
  if (totalInvested === 0) return [];

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const growthRate = (totalValue - totalInvested) / totalInvested;

  return months.map((label, i) => {
    const progress = i / (months.length - 1);
    const noise = 0.8 + Math.sin(i * 1.5) * 0.2;
    const value = totalInvested * (1 + growthRate * progress * noise);
    return { value: Math.round(value), label };
  });
}

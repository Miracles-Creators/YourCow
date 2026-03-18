"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import type { PortfolioSummaryLotDto } from "~~/lib/api/schemas";

interface PortfolioValueChartProps {
  lots: PortfolioSummaryLotDto[];
  totalValue: number;
}

type ChartPoint = {
  value: number;
  label: string;
};

export function PortfolioValueChart({
  lots,
  totalValue,
}: PortfolioValueChartProps) {
  const t = useTranslations("investor.dashboard.chart");
  const gradientId = useId();
  const { points, isPlaceholder } = generateChartPoints(lots, totalValue);

  const minVal = Math.min(...points.map((point) => point.value));
  const maxVal = Math.max(...points.map((point) => point.value));
  const range = maxVal - minVal || 1;
  const padding = range * 0.1;

  const toY = (value: number) =>
    160 - ((value - minVal + padding) / (range + 2 * padding)) * 150;

  const linePath = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 416;
      const y = toY(point.value);
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const guidePath = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 416;
      const y = toY(point.value);
      const offset = isPlaceholder ? 10 : 6;
      return `${index === 0 ? "M" : "L"} ${x} ${Math.min(154, y + offset)}`;
    })
    .join(" ");

  const areaPath = [linePath, "L 416 160 L 0 160 Z"].join(" ");
  const lastPoint = points[points.length - 1];
  const lastPointY = toY(lastPoint.value);

  return (
    <div className="relative h-40 w-full overflow-hidden rounded-3xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white lg:h-full lg:min-h-[10rem]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-vaca-gold-light/40 to-transparent" />

      <svg
        className="relative h-full w-full"
        viewBox="0 0 416 160"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B5E20" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1B5E20" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M 0 132 L 416 132"
          stroke="#E7ECE8"
          strokeWidth="1"
          strokeDasharray="5 5"
        />
        <path
          d={guidePath}
          stroke="#C8D8CB"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="6 6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={linePath}
          stroke="#1B5E20"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={416} cy={lastPointY} r="4" fill="#1B5E20" />

        {points.map((point, index) => {
          const x = (index / (points.length - 1)) * 416;
          const textAnchor =
            index === 0
              ? "start"
              : index === points.length - 1
                ? "end"
                : "middle";

          return (
            <text
              key={point.label}
              x={x}
              y="154"
              textAnchor={textAnchor}
              fill="#94A39A"
              fontSize="9"
              fontFamily="Inter, sans-serif"
            >
              {point.label}
            </text>
          );
        })}
      </svg>

      {isPlaceholder && (
        <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center px-4">
          <div className="rounded-full border border-vaca-gold-border bg-vaca-gold-light/80 px-3 py-1 font-inter text-[11px] font-medium text-vaca-neutral-gray-700 backdrop-blur-sm">
            {t("noData")}
          </div>
        </div>
      )}
    </div>
  );
}

function generateChartPoints(
  lots: PortfolioSummaryLotDto[],
  totalValue: number,
): { points: ChartPoint[]; isPlaceholder: boolean } {
  const totalInvested = lots.reduce((sum, lot) => sum + lot.invested, 0);

  if (lots.length === 0 || totalInvested === 0) {
    return {
      points: generatePlaceholderPoints(),
      isPlaceholder: true,
    };
  }

  return {
    points: generatePreviewPoints(totalInvested, totalValue),
    isPlaceholder: false,
  };
}

function generatePreviewPoints(
  totalInvested: number,
  totalValue: number,
): ChartPoint[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const delta = totalValue - totalInvested;
  const baselineStart = totalInvested * 0.94;
  const waveAmplitude = Math.max(totalInvested * 0.012, Math.abs(delta) * 0.35);

  return months.map((label, index) => {
    const progress = index / (months.length - 1);
    const baseline = baselineStart + (totalValue - baselineStart) * progress;
    const wave =
      Math.sin(progress * Math.PI * 1.3) * waveAmplitude +
      Math.sin(progress * Math.PI * 3.2) * waveAmplitude * 0.28;
    const value =
      index === months.length - 1
        ? totalValue
        : Math.max(totalInvested * 0.88, baseline + wave);

    return { value: Math.round(value), label };
  });
}

function generatePlaceholderPoints(): ChartPoint[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const values = [72, 78, 75, 86, 92, 104];

  return months.map((label, index) => ({
    value: values[index],
    label,
  }));
}

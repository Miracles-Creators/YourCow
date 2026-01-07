"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  Package,
  DollarSign,
  Scale,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { getPositionById } from "../../_constants/mockData";
import { cn } from "~~/lib/utils/cn";

interface PositionDetailScreenProps {
  positionId: string;
}

/**
 * PositionDetailScreen (INV-14)
 * Detailed view of an investment position with NAV evolution and production metrics
 */
export function PositionDetailScreen({
  positionId,
}: PositionDetailScreenProps) {
  const t = useTranslations("investor.positionDetail");

  const position = getPositionById(positionId);

  if (!position) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
            Position not found
          </h2>
          <Link
            href="/portfolio"
            className="font-inter text-sm text-vaca-blue hover:underline"
          >
            ← {t("backButton")}
          </Link>
        </div>
      </div>
    );
  }

  const isProfit = position.gain >= 0;

  return (
    <div className="relative pb-24">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 border-b border-vaca-neutral-gray-200 bg-vaca-neutral-white/90 backdrop-blur-lg">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 font-inter text-sm text-vaca-neutral-gray-600 transition-colors hover:text-vaca-green"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t("backButton")}</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Position Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4">
            <span className="mb-2 inline-block rounded-lg bg-vaca-green/10 px-3 py-1 font-inter text-xs font-medium text-vaca-green">
              {t("status")}
            </span>
            <h1 className="mb-2 font-playfair text-4xl font-bold text-vaca-green">
              {position.lot.name}
            </h1>
            <p className="font-inter text-vaca-neutral-gray-600">
              {t("investment.date")}{" "}
              {new Date(position.investmentDate).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </motion.div>

        {/* Top Row: Performance + NAV Chart */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Left: Performance Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-8"
          >
            <h2 className="mb-6 font-playfair text-2xl font-semibold text-vaca-green">
              {t("overview")}
            </h2>

            <div className="space-y-6">
              {/* Investment Amount */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 font-inter text-sm text-vaca-neutral-gray-500">
                    {t("investment.amount")}
                  </p>
                  <p className="font-playfair text-3xl font-semibold text-vaca-neutral-gray-900">
                    ${position.investmentAmount.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-vaca-neutral-gray-100">
                  <DollarSign className="h-6 w-6 text-vaca-neutral-gray-600" />
                </div>
              </div>

              <div className="h-px bg-vaca-neutral-gray-200" />

              {/* Current Value */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 font-inter text-sm text-vaca-neutral-gray-500">
                    {t("currentValue.nav")}
                  </p>
                  <p className="font-playfair text-3xl font-semibold text-vaca-green">
                    ${position.currentNAV.toLocaleString()}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-vaca-green/10">
                  <TrendingUp className="h-6 w-6 text-vaca-green" />
                </div>
              </div>

              <div className="h-px bg-vaca-neutral-gray-200" />

              {/* Gain - Highlighted */}
              <div className="rounded-2xl bg-gradient-to-br from-green-50 to-vaca-green/5 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-1 font-inter text-sm text-vaca-neutral-gray-600">
                      {t("currentValue.gain")}
                    </p>
                    <p
                      className={cn(
                        "font-playfair text-4xl font-bold",
                        isProfit ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {isProfit ? "+" : ""}${position.gain.toLocaleString()}
                    </p>
                    <p
                      className={cn(
                        "mt-2 flex items-center gap-2 font-inter text-lg font-semibold",
                        isProfit ? "text-green-600" : "text-red-600",
                      )}
                    >
                      <TrendingUp className="h-5 w-5" />
                      {isProfit ? "+" : ""}
                      {position.gainPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: NAV Evolution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-3xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-8"
          >
            <h2 className="mb-6 font-playfair text-2xl font-semibold text-vaca-green">
              NAV Evolution
            </h2>

            {/* Simple Line Chart */}
            <div className="relative h-64">
              <svg className="h-full w-full" viewBox="0 0 800 250">
                {/* Grid lines */}
                <line
                  x1="50"
                  y1="10"
                  x2="50"
                  y2="210"
                  stroke="#e5e5e5"
                  strokeWidth="1"
                />
                <line
                  x1="50"
                  y1="210"
                  x2="750"
                  y2="210"
                  stroke="#e5e5e5"
                  strokeWidth="1"
                />

                {/* Y-axis labels */}
                <text
                  x="10"
                  y="15"
                  className="fill-vaca-neutral-gray-500 font-inter text-xs"
                >
                  $
                  {(
                    Math.max(...position.navHistory.map((h) => h.value)) / 1000
                  ).toFixed(0)}
                  k
                </text>
                <text
                  x="10"
                  y="215"
                  className="fill-vaca-neutral-gray-500 font-inter text-xs"
                >
                  $
                  {(
                    Math.min(...position.navHistory.map((h) => h.value)) / 1000
                  ).toFixed(0)}
                  k
                </text>

                {/* Line path */}
                <path
                  d={position.navHistory
                    .map((point, i) => {
                      const x =
                        50 + (i / (position.navHistory.length - 1)) * 700;
                      const minVal = Math.min(
                        ...position.navHistory.map((h) => h.value),
                      );
                      const maxVal = Math.max(
                        ...position.navHistory.map((h) => h.value),
                      );
                      const y =
                        210 -
                        ((point.value - minVal) / (maxVal - minVal)) * 200;
                      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                    })
                    .join(" ")}
                  stroke="#1B5E20"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {position.navHistory.map((point, i) => {
                  const x = 50 + (i / (position.navHistory.length - 1)) * 700;
                  const minVal = Math.min(
                    ...position.navHistory.map((h) => h.value),
                  );
                  const maxVal = Math.max(
                    ...position.navHistory.map((h) => h.value),
                  );
                  const y =
                    210 - ((point.value - minVal) / (maxVal - minVal)) * 200;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="4"
                      className="fill-vaca-green"
                    />
                  );
                })}
              </svg>
            </div>

            {/* Timeline labels */}
            <div className="mt-4 flex justify-between px-12">
              {position.navHistory.map((point, i) => (
                <div key={i} className="text-center">
                  <p className="font-inter text-xs text-vaca-neutral-gray-500">
                    {new Date(point.date).toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row: Production Metrics + Liquidity Window */}
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          {/* Left: Production Metrics - Simplified */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-6"
          >
            <h2 className="mb-4 font-playfair text-xl font-semibold text-vaca-green">
              Valor de Producción
            </h2>

            {/* Simple Calculation Display */}
            <div className="mb-4 rounded-xl bg-vaca-neutral-gray-50 p-4">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="font-inter text-sm text-vaca-neutral-gray-600">
                  {position.productionMetrics.totalHeadCount} cabezas
                </span>
                <span className="font-inter text-sm text-vaca-neutral-gray-600">
                  × {position.productionMetrics.avgWeightKg} kg/cabeza
                </span>
              </div>
              <div className="mb-3 border-t border-vaca-neutral-gray-200 pt-3 text-center">
                <p className="font-inter text-xs text-vaca-neutral-gray-500">
                  Total de carne
                </p>
                <p className="font-playfair text-3xl font-bold text-vaca-green">
                  {position.productionMetrics.totalMeatKg.toLocaleString()} kg
                </p>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-inter text-sm text-vaca-neutral-gray-600">
                  ${position.productionMetrics.pricePerKg} por kg
                </span>
              </div>
            </div>

            {/* Final Revenue */}
            <div className="rounded-xl border-2 border-vaca-green bg-vaca-green/5 p-4 text-center">
              <p className="mb-1 font-inter text-sm text-vaca-neutral-gray-600">
                Revenue Total Proyectado
              </p>
              <p className="font-playfair text-4xl font-bold text-vaca-green">
                ${position.productionMetrics.projectedRevenue.toLocaleString()}
              </p>
              <p className="mt-2 font-inter text-xs text-vaca-neutral-gray-500">
                {position.productionMetrics.totalMeatKg.toLocaleString()} kg × $
                {position.productionMetrics.pricePerKg}/kg
              </p>
            </div>
          </motion.div>

          {/* Right: Liquidity Window */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-6"
          >
            <h2 className="mb-4 font-playfair text-xl font-semibold text-vaca-neutral-gray-900">
              Ventana de Liquidez
            </h2>

            <div className="mb-4 text-center">
              <p className="mb-2 font-inter text-sm text-vaca-neutral-gray-500">
                Próxima fecha disponible
              </p>
              <p className="mb-4 font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
                {new Date(position.liquidityWindow.nextDate).toLocaleDateString(
                  "es-ES",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  },
                )}
              </p>

              <div className="mb-4 rounded-xl bg-vaca-neutral-gray-50 p-6">
                <p className="mb-1 font-inter text-sm text-vaca-neutral-gray-500">
                  Faltan
                </p>
                <div className="flex items-baseline justify-center gap-2">
                  <p className="font-playfair text-6xl font-bold text-vaca-green">
                    {position.liquidityWindow.daysRemaining}
                  </p>
                  <p className="font-inter text-xl text-vaca-neutral-gray-600">
                    días
                  </p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            {position.liquidityWindow.isEligible && (
              <button
                className="w-full rounded-xl bg-vaca-green px-6 py-3 font-inter font-semibold text-vaca-neutral-white transition-all hover:bg-green-700"
                onClick={() => alert("Sell shares functionality coming soon")}
              >
                Vender Acciones
              </button>
            )}

            {position.liquidityWindow.isEligible && (
              <p className="mt-3 text-center font-inter text-xs text-vaca-neutral-gray-500">
                El proceso de venta toma 3-5 días hábiles
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

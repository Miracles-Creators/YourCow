"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  MapPin,
  ArrowRightLeft,
  Check,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLot } from "~~/hooks/lots/useLot";
import { usePortfolioSummary, usePortfolioByLot, useCreateOffer } from "~~/hooks/marketplace";
import { cn } from "~~/lib/utils/cn";
import type { ProductionType, LotStatus } from "~~/lib/api/schemas";
import { containerVariants, itemVariants } from "../animations";

const LOT_IMAGES = [
  "/images/cattle-angus.jpg",
  "/images/cattle-hereford.jpg",
  "/vaca-image-btc.png",
];

function getLotImage(lotId: number): string {
  return LOT_IMAGES[lotId % LOT_IMAGES.length];
}

const CATEGORY_KEY: Record<ProductionType, string> = {
  FEEDLOT: "fattening",
  PASTURE: "breeding",
  MIXED: "dairy",
};

const STATUS_CONFIG: Record<LotStatus, { dot: string; key: string }> = {
  ACTIVE: { dot: "bg-vaca-green", key: "active" },
  FUNDING: { dot: "bg-vaca-gold", key: "pending" },
  COMPLETED: { dot: "bg-vaca-blue", key: "completed" },
  SETTLING: { dot: "bg-vaca-warning", key: "settling" },
  DRAFT: { dot: "bg-vaca-neutral-gray-400", key: "draft" },
  PENDING_DEPLOY: { dot: "bg-vaca-neutral-gray-400", key: "pending" },
};

// ─── Chart helpers ──────────────────────────────────────────

const CHART_W = 400;
const CHART_H = 100;

function computeNavTrendPath(
  invested: number,
  currentValue: number,
  numPoints = 8,
): { linePath: string; fillPath: string } {
  const pad = 10;
  const h = CHART_H - pad * 2;
  const lo = Math.min(invested, currentValue) * 0.97;
  const hi = Math.max(invested, currentValue) * 1.03;
  const range = hi - lo || 1;
  const xStep = CHART_W / (numPoints - 1);

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const eased = 1 - Math.pow(1 - t, 2.5);
    const val = invested + (currentValue - invested) * eased;
    const noise = Math.sin(i * 2.7 + 0.5) * range * 0.015;
    pts.push({ x: i * xStep, y: pad + h - ((val + noise - lo) / range) * h });
  }

  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C${cpx},${pts[i - 1].y} ${cpx},${pts[i].y} ${pts[i].x},${pts[i].y}`;
  }

  return { linePath: d, fillPath: `${d} L${CHART_W},${CHART_H} L0,${CHART_H} Z` };
}

// ─── Sub-components ─────────────────────────────────────────

function MetricCard({
  label,
  value,
  valueColor = "text-vaca-neutral-gray-900",
  sub,
}: {
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-vaca-neutral-gray-50 bg-vaca-neutral-white p-4 shadow-sm">
      <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
        {label}
      </p>
      <p className={cn("mt-2 font-inter text-2xl font-bold tracking-tight", valueColor)}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 font-inter text-[10px] text-vaca-neutral-gray-500">{sub}</p>
      )}
    </div>
  );
}

function ProducerCard({
  name,
  verified,
  farmName,
  experience,
}: {
  name: string;
  verified: boolean;
  farmName?: string | null;
  experience?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-vaca-green">
        <ShieldCheck className="h-6 w-6 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
            {name}
          </h3>
          {verified && (
            <span className="rounded-full bg-vaca-success-light px-2 py-0.5 font-inter text-[9px] font-bold uppercase tracking-wider text-vaca-success">
              Verified
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          {farmName && (
            <span className="flex items-center gap-1 font-inter text-xs text-vaca-neutral-gray-500">
              <MapPin className="h-3 w-3" />
              {farmName}
            </span>
          )}
          {experience && (
            <span className="font-inter text-xs text-vaca-neutral-gray-500">
              {experience}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sell Form ──────────────────────────────────────────────

function SellForm({
  lotId,
  availableShares,
  defaultPricePerShare,
  lotStatus,
  onSuccess,
}: {
  lotId: number;
  availableShares: number;
  defaultPricePerShare: number;
  lotStatus?: LotStatus;
  onSuccess?: () => void;
}) {
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState(defaultPricePerShare.toString());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const createOffer = useCreateOffer();

  const canSell = lotStatus === "ACTIVE";
  const sharesNum = Number(shares) || 0;
  const priceNum = Number(price) || 0;
  const total = sharesNum * priceNum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (sharesNum <= 0 || sharesNum > availableShares) {
      setError(`Enter between 1 and ${availableShares} shares.`);
      return;
    }
    if (priceNum <= 0) {
      setError("Price must be greater than 0.");
      return;
    }

    try {
      await createOffer.mutateAsync({
        lotId,
        sharesAmount: sharesNum,
        pricePerShare: priceNum,
        currency: "ARS",
        idempotencyKey: `sell_${lotId}_${Date.now()}`,
      });
      setSuccess(true);
      setShares("");
      setPrice(defaultPricePerShare.toString());
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create offer.");
    }
  };

  if (!canSell) {
    return (
      <div className="rounded-xl bg-vaca-neutral-gray-50 p-4 text-center">
        <p className="font-inter text-xs text-vaca-neutral-gray-500">
          Selling is available when the lot is <span className="font-semibold">Active</span>.
        </p>
      </div>
    );
  }

  if (availableShares <= 0) {
    return (
      <div className="rounded-xl bg-vaca-neutral-gray-50 p-4 text-center">
        <p className="font-inter text-xs text-vaca-neutral-gray-500">
          No available shares to sell. All shares are locked in existing offers.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="sell-shares" className="mb-1.5 block font-inter text-xs font-semibold text-vaca-neutral-gray-600">
          Shares to sell
        </label>
        <div className="relative">
          <input
            id="sell-shares"
            type="number"
            min={1}
            max={availableShares}
            step={1}
            value={shares}
            onChange={(e) => { setShares(e.target.value); setError(""); setSuccess(false); }}
            placeholder={`Max ${availableShares}`}
            className="w-full rounded-xl border-2 border-vaca-neutral-gray-100 bg-vaca-neutral-white px-4 py-3 font-inter text-sm text-vaca-neutral-gray-900 transition-colors focus:border-vaca-green focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShares(availableShares.toString())}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-vaca-green/10 px-2 py-1 font-inter text-[10px] font-bold uppercase tracking-wider text-vaca-green transition-colors hover:bg-vaca-green/20"
          >
            Max
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="sell-price" className="mb-1.5 block font-inter text-xs font-semibold text-vaca-neutral-gray-600">
          Price per share (ARS)
        </label>
        <input
          id="sell-price"
          type="number"
          min={0.01}
          step={0.01}
          value={price}
          onChange={(e) => { setPrice(e.target.value); setError(""); setSuccess(false); }}
          className="w-full rounded-xl border-2 border-vaca-neutral-gray-100 bg-vaca-neutral-white px-4 py-3 font-inter text-sm text-vaca-neutral-gray-900 transition-colors focus:border-vaca-green focus:outline-none"
        />
      </div>

      {sharesNum > 0 && priceNum > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-vaca-neutral-gray-50 px-4 py-3">
          <span className="font-inter text-xs text-vaca-neutral-gray-500">Total</span>
          <span className="font-inter text-sm font-bold text-vaca-neutral-gray-900">
            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-inter text-xs text-vaca-error"
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl bg-vaca-green/10 px-4 py-3"
          >
            <Check className="h-4 w-4 text-vaca-green" />
            <p className="font-inter text-xs font-semibold text-vaca-green">
              Offer created successfully!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={createOffer.isPending || success}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl font-inter text-sm font-bold transition-all",
          success
            ? "bg-vaca-green/10 text-vaca-green"
            : "bg-vaca-green text-white hover:bg-vaca-green-dark",
          createOffer.isPending && "pointer-events-none opacity-70",
        )}
      >
        {createOffer.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : success ? (
          <Check className="h-4 w-4" />
        ) : (
          <ArrowRightLeft className="h-4 w-4" />
        )}
        {createOffer.isPending ? "Creating offer..." : success ? "Offer created" : "Create sell offer"}
      </motion.button>
    </form>
  );
}

// ─── Main Component ─────────────────────────────────────────

interface PositionDetailScreenProps {
  lotId: number;
}

export function PositionDetailScreen({ lotId }: PositionDetailScreenProps) {
  const t = useTranslations("investor.positionDetail");
  const tCommon = useTranslations("common");
  const tCategories = useTranslations("investor.lotDetail.categories");
  const tStatus = useTranslations("common.status");

  const { data: lot, isPending: lotPending } = useLot(lotId);
  const { data: summary, isPending: summaryPending } = usePortfolioSummary();
  const { data: positionByLot } = usePortfolioByLot(lotId);

  const position = useMemo(
    () => summary?.lots.find((l) => l.lotId === lotId) ?? null,
    [summary, lotId],
  );

  const chart = useMemo(
    () => (position ? computeNavTrendPath(position.invested, position.currentValue) : null),
    [position],
  );

  if (lotPending || summaryPending) return <PositionDetailSkeleton />;

  if (!position) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-vaca-neutral-gray-100">
            <TrendingUp className="h-8 w-8 text-vaca-neutral-gray-400" />
          </div>
          <h2 className="mb-2 font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
            {t("noPosition")}
          </h2>
          <p className="mb-6 font-inter text-sm text-vaca-neutral-gray-500">
            {t("noPositionDesc")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white px-5 py-2.5 font-inter text-sm font-medium text-vaca-neutral-gray-700 transition-colors hover:bg-vaca-neutral-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToDashboard")}
            </Link>
            {lot && (
              <Link
                href={`/lot/${lotId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-vaca-green px-5 py-2.5 font-inter text-sm font-semibold text-white transition-colors hover:bg-vaca-green-dark"
              >
                {t("viewLot")}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Data extraction ──────────────────────────────────────

  const metadata =
    lot?.metadata && typeof lot.metadata === "object"
      ? (lot.metadata as Record<string, unknown>)
      : {};
  const metaStr = (key: string, fb = "") => {
    const v = metadata[key];
    return typeof v === "string" ? v : fb;
  };

  const lotName = position.lotName || lot?.name || `Lot #${lotId}`;
  const imageUrl = metaStr("imageUrl") || getLotImage(lotId);
  const categoryKey = CATEGORY_KEY[position.productionType] ?? "fattening";
  const categoryLabel = tCategories(categoryKey);
  const statusCfg = STATUS_CONFIG[position.status] ?? STATUS_CONFIG.ACTIVE;
  const statusLabel = tStatus(statusCfg.key);

  const gain = position.currentValue - position.invested;
  const isPositive = gain >= 0;

  const totalShares = positionByLot ? Number(positionByLot.total) : null;
  const lockedShares = positionByLot ? Number(positionByLot.locked) : null;
  const participation =
    totalShares != null && lot?.totalShares
      ? ((totalShares / lot.totalShares) * 100).toFixed(1)
      : null;

  const producerName = lot?.producer?.user?.name;
  const producerVerified = lot?.producer?.status === "ACTIVE";
  const producerExperience = metaStr("producerExperience");

  const detailRows = [
    { label: t("lot.category"), value: categoryLabel },
    lot?.cattleCount ? { label: t("lot.herdSize"), value: lot.cattleCount.toLocaleString() } : null,
    lot?.durationWeeks
      ? { label: t("duration"), value: `${lot.durationWeeks} ${tCommon("time.weeks")}` }
      : null,
    lot?.location ? { label: t("lot.location"), value: lot.location } : null,
    lot?.investorPercent
      ? { label: t("expectedReturn"), value: `${lot.investorPercent}%` }
      : null,
  ].filter(Boolean) as { label: string; value: string }[];

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="relative pb-36 lg:mx-auto lg:max-w-6xl lg:px-8 lg:pb-12">
      {/* Hero — mobile only */}
      <div className="relative h-[280px] w-full overflow-hidden lg:hidden">
        <Image
          src={imageUrl}
          alt={lotName}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        <header className="absolute top-0 z-10 flex w-full items-center p-5">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30"
            aria-label={t("backToDashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </header>

        {/* Value overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="font-playfair text-3xl font-bold text-white drop-shadow-md">
            ${position.currentValue.toLocaleString()}
          </p>
          <div
            className={cn(
              "mt-1.5 flex items-center gap-1.5 font-inter text-sm font-semibold drop-shadow-sm",
              isPositive ? "text-green-300" : "text-red-300",
            )}
          >
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {isPositive ? "+" : ""}${Math.abs(gain).toLocaleString()} (
            {isPositive ? "+" : ""}
            {position.returnPercent.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "relative",
          "-mt-10 rounded-t-[2rem] bg-vaca-neutral-bg px-6 pt-8",
          "lg:-mt-0 lg:rounded-t-none lg:bg-transparent lg:px-0 lg:pt-8",
        )}
      >
        <div className="lg:grid lg:grid-cols-5 lg:items-start lg:gap-10">
          {/* ════════ Main Column ════════ */}
          <div className="lg:col-span-3">
            {/* Desktop: back + title row */}
            <motion.div variants={itemVariants} className="mb-8 hidden lg:block">
              <Link
                href="/dashboard"
                className="mb-4 inline-flex items-center gap-1.5 font-inter text-sm font-medium text-vaca-neutral-gray-400 transition-colors hover:text-vaca-neutral-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("backToDashboard")}
              </Link>

              <div className="flex items-start gap-5">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
                  <Image src={imageUrl} alt={lotName} fill className="object-cover" sizes="96px" />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <h1 className="font-playfair text-3xl leading-tight text-vaca-neutral-gray-900">
                    {lotName}
                  </h1>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="rounded-full bg-vaca-green/10 px-2.5 py-0.5 font-inter text-[10px] font-bold uppercase tracking-wider text-vaca-green">
                      {categoryLabel}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-vaca-neutral-gray-200" />
                    <span className="flex items-center gap-1.5 font-inter text-[10px] font-bold uppercase tracking-[0.15em] text-vaca-neutral-gray-400">
                      <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
                      {statusLabel}
                    </span>
                    {lot?.location && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-vaca-neutral-gray-200" />
                        <span className="flex items-center gap-1 font-inter text-[10px] font-bold uppercase tracking-[0.15em] text-vaca-neutral-gray-400">
                          <MapPin className="h-3 w-3" />
                          {lot.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mobile title */}
            <motion.div variants={itemVariants} className="mb-6 lg:hidden">
              <h1 className="font-playfair text-2xl leading-tight text-vaca-neutral-gray-900">
                {lotName}
              </h1>
              <div className="mt-1.5 flex items-center gap-2.5">
                <span className="rounded-full bg-vaca-green/10 px-2.5 py-0.5 font-inter text-[10px] font-bold uppercase tracking-wider text-vaca-green">
                  {categoryLabel}
                </span>
                <span className="flex items-center gap-1.5 font-inter text-[10px] font-bold uppercase tracking-[0.15em] text-vaca-neutral-gray-400">
                  <span className={cn("h-1.5 w-1.5 rounded-full", statusCfg.dot)} />
                  {statusLabel}
                </span>
              </div>
            </motion.div>

            {/* Financial metrics 2×2 */}
            <motion.div variants={itemVariants} className="mb-8 grid grid-cols-2 gap-3">
              <MetricCard
                label={t("investment.amount")}
                value={`$${position.invested.toLocaleString()}`}
              />
              <MetricCard
                label={t("currentValue.gainPercentage")}
                value={`${isPositive ? "+" : ""}${position.returnPercent.toFixed(1)}%`}
                valueColor={isPositive ? "text-vaca-green" : "text-vaca-error"}
              />
              <MetricCard
                label={t("investment.shares")}
                value={totalShares?.toString() ?? "—"}
                sub={participation ? `${participation}% ${t("holdings.shareOfLot")}` : undefined}
              />
              <MetricCard
                label={t("daysRemaining")}
                value={position.daysRemaining != null ? `${position.daysRemaining}d` : "—"}
              />
            </motion.div>

            {/* NAV trend chart */}
            {chart && (
              <motion.div
                variants={itemVariants}
                className="mb-8 rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 lg:p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-inter text-base font-bold text-vaca-neutral-gray-900">
                    {t("navTrend")}
                  </h2>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 font-inter text-[10px] font-bold uppercase tracking-wider",
                      isPositive ? "bg-vaca-green/5 text-vaca-green" : "bg-vaca-error/5 text-vaca-error",
                    )}
                  >
                    {isPositive ? "+" : ""}
                    {position.returnPercent.toFixed(1)}%
                  </span>
                </div>

                <div className="relative h-36 w-full lg:h-44">
                  <svg
                    className="absolute bottom-0 left-0 h-full w-full"
                    preserveAspectRatio="none"
                    viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  >
                    <defs>
                      <linearGradient id="posNavFill" x1="0" x2="0" y1="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={isPositive ? "#1B5E20" : "#DC2626"}
                          stopOpacity="0.12"
                        />
                        <stop
                          offset="100%"
                          stopColor={isPositive ? "#1B5E20" : "#DC2626"}
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path d={chart.fillPath} fill="url(#posNavFill)" />
                    <path
                      d={chart.linePath}
                      fill="none"
                      stroke={isPositive ? "#1B5E20" : "#DC2626"}
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>

                <div className="mt-3 flex justify-between font-inter text-[10px] font-bold uppercase tracking-widest text-vaca-neutral-gray-400">
                  <span>{t("chartStart")}</span>
                  <span>{t("chartNow")}</span>
                </div>
              </motion.div>
            )}

            {/* Production highlights */}
            {(lot?.cattleCount || position.weightGainPercent != null) && (
              <motion.div
                variants={itemVariants}
                className="mb-8 rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 lg:p-6"
              >
                <h2 className="mb-4 font-playfair text-base font-semibold text-vaca-neutral-gray-900">
                  {t("metrics.productionTitle")}
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {lot?.cattleCount != null && (
                    <div className="rounded-xl bg-vaca-neutral-gray-50 p-3.5">
                      <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
                        {t("metrics.headCount")}
                      </p>
                      <p className="mt-1 font-inter text-xl font-bold text-vaca-neutral-gray-900">
                        {lot.cattleCount.toLocaleString()}
                      </p>
                      <p className="mt-0.5 font-inter text-[10px] text-vaca-neutral-gray-500">
                        {t("metrics.headCountSuffix")}
                      </p>
                    </div>
                  )}
                  {lot?.averageWeightKg != null && (
                    <div className="rounded-xl bg-vaca-neutral-gray-50 p-3.5">
                      <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
                        {t("metrics.avgWeight")}
                      </p>
                      <p className="mt-1 font-inter text-xl font-bold text-vaca-neutral-gray-900">
                        {lot.averageWeightKg}
                        <span className="text-sm font-medium text-vaca-neutral-gray-500"> kg</span>
                      </p>
                    </div>
                  )}
                  {position.weightGainPercent != null && (
                    <div className="rounded-xl bg-vaca-green/5 p-3.5">
                      <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
                        {t("weightGain")}
                      </p>
                      <p className="mt-1 font-inter text-xl font-bold text-vaca-green">
                        +{position.weightGainPercent.toFixed(1)}%
                      </p>
                    </div>
                  )}
                  {position.estimatedEndDate && (
                    <div className="rounded-xl bg-vaca-neutral-gray-50 p-3.5">
                      <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
                        {t("estimatedEnd")}
                      </p>
                      <p className="mt-1 font-inter text-base font-bold text-vaca-neutral-gray-900">
                        {new Date(position.estimatedEndDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Detail rows */}
            {detailRows.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="lg:rounded-2xl lg:border lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-white lg:p-6"
              >
                <h3 className="mb-3 font-playfair text-base font-semibold text-vaca-neutral-gray-900 lg:mb-4">
                  {t("details")}
                </h3>
                {detailRows.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-vaca-neutral-gray-50 py-3.5 last:border-b-0"
                  >
                    <span className="font-inter text-xs font-semibold uppercase tracking-wider text-vaca-neutral-gray-400">
                      {label}
                    </span>
                    <span className="font-inter text-sm font-bold text-vaca-neutral-gray-900">
                      {value}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Producer — mobile only */}
            {producerName && (
              <motion.div
                variants={itemVariants}
                className="mt-6 rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 lg:hidden"
              >
                <ProducerCard
                  name={producerName}
                  verified={producerVerified}
                  farmName={lot?.farmName}
                  experience={producerExperience}
                />
              </motion.div>
            )}

            {/* Mobile sell form */}
            <motion.div
              variants={itemVariants}
              className="mt-6 rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 lg:hidden"
            >
              <h3 className="mb-4 font-inter text-sm font-bold text-vaca-neutral-gray-900">
                Sell shares
              </h3>
              <SellForm
                lotId={lotId}
                availableShares={totalShares != null && lockedShares != null ? totalShares - lockedShares : 0}
                defaultPricePerShare={lot?.pricePerShare ?? 0}
                lotStatus={position.status}
              />
            </motion.div>

            <div className="h-8 lg:hidden" />
          </div>

          {/* ════════ Sidebar — desktop only ════════ */}
          <div className="hidden lg:col-span-2 lg:block">
            <div className="sticky top-8 space-y-6">
              {/* Position summary card */}
              <motion.div
                variants={itemVariants}
                className="overflow-hidden rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white shadow-sm"
              >
                <div className="p-6">
                  <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
                    {t("positionValue")}
                  </p>
                  <p className="mt-2 font-playfair text-4xl font-bold text-vaca-neutral-gray-900">
                    ${position.currentValue.toLocaleString()}
                  </p>
                  <div
                    className={cn(
                      "mt-2 flex items-center gap-1.5 font-inter text-sm font-semibold",
                      isPositive ? "text-vaca-green" : "text-vaca-error",
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {isPositive ? "+" : ""}${Math.abs(gain).toLocaleString()} (
                    {isPositive ? "+" : ""}
                    {position.returnPercent.toFixed(1)}%)
                  </div>

                  <div className="my-5 border-t border-vaca-neutral-gray-50" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-inter text-xs text-vaca-neutral-gray-500">
                        {t("investment.amount")}
                      </span>
                      <span className="font-inter text-sm font-bold tabular-nums text-vaca-neutral-gray-900">
                        ${position.invested.toLocaleString()}
                      </span>
                    </div>
                    {totalShares != null && (
                      <div className="flex items-center justify-between">
                        <span className="font-inter text-xs text-vaca-neutral-gray-500">
                          {t("yourShares")}
                        </span>
                        <span className="font-inter text-sm font-bold tabular-nums text-vaca-neutral-gray-900">
                          {totalShares}
                        </span>
                      </div>
                    )}
                    {lockedShares != null && lockedShares > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="font-inter text-xs text-vaca-neutral-gray-500">
                          {t("lockedInOffers")}
                        </span>
                        <span className="font-inter text-sm font-bold tabular-nums text-vaca-warning">
                          {lockedShares}
                        </span>
                      </div>
                    )}
                    {participation && (
                      <div className="flex items-center justify-between">
                        <span className="font-inter text-xs text-vaca-neutral-gray-500">
                          {t("holdings.shareOfLot")}
                        </span>
                        <span className="font-inter text-sm font-bold tabular-nums text-vaca-neutral-gray-900">
                          {participation}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-vaca-neutral-gray-50 p-6">
                  <h3 className="mb-4 font-inter text-sm font-bold text-vaca-neutral-gray-900">
                    Sell shares
                  </h3>
                  <SellForm
                    lotId={lotId}
                    availableShares={totalShares != null && lockedShares != null ? totalShares - lockedShares : 0}
                    defaultPricePerShare={lot?.pricePerShare ?? 0}
                    lotStatus={position.status}
                  />
                </div>
              </motion.div>

              {/* Producer card */}
              {producerName && (
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5"
                >
                  <ProducerCard
                    name={producerName}
                    verified={producerVerified}
                    farmName={lot?.farmName}
                    experience={producerExperience}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────

function PositionDetailSkeleton() {
  return (
    <div className="animate-pulse lg:mx-auto lg:max-w-6xl lg:px-8">
      <div className="h-[280px] w-full bg-vaca-neutral-gray-100 lg:hidden" />

      <div className="relative -mt-10 rounded-t-[2rem] bg-vaca-neutral-bg px-6 pt-8 lg:-mt-0 lg:rounded-t-none lg:bg-transparent lg:px-0 lg:pt-8">
        <div className="lg:grid lg:grid-cols-5 lg:items-start lg:gap-10">
          <div className="lg:col-span-3">
            <div className="mb-8 hidden items-start gap-5 lg:flex">
              <div className="h-24 w-24 shrink-0 rounded-xl bg-vaca-neutral-gray-100" />
              <div className="flex-1 pt-1">
                <div className="h-8 w-48 rounded-lg bg-vaca-neutral-gray-100" />
                <div className="mt-3 h-3 w-32 rounded bg-vaca-neutral-gray-100" />
              </div>
            </div>
            <div className="mb-6 lg:hidden">
              <div className="h-7 w-40 rounded-lg bg-vaca-neutral-gray-100" />
              <div className="mt-2 h-3 w-24 rounded bg-vaca-neutral-gray-100" />
            </div>
            <div className="mb-8 grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-vaca-neutral-gray-100" />
              ))}
            </div>
            <div className="mb-8 h-56 rounded-2xl bg-vaca-neutral-gray-100" />
            <div className="mb-8 h-40 rounded-2xl bg-vaca-neutral-gray-100" />
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 rounded bg-vaca-neutral-gray-50" />
              ))}
            </div>
          </div>
          <div className="hidden lg:col-span-2 lg:block">
            <div className="space-y-6">
              <div className="h-72 rounded-2xl bg-vaca-neutral-gray-100" />
              <div className="h-24 rounded-2xl bg-vaca-neutral-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

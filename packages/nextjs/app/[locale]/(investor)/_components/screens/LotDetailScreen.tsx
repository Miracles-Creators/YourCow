"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Share2,
  TrendingUp,
  ShieldCheck,
  MapPin,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLot } from "~~/hooks/lots/useLot";
import { useOffers, usePortfolio } from "~~/hooks/marketplace";
import { cn } from "~~/lib/utils/cn";
import type { OfferDto, ProductionType } from "~~/lib/api/schemas";
import { formatStrkWei } from "~~/utils/scaffold-stark/common";
import { containerVariants, itemVariants } from "../animations";
import { AcceptOfferModal } from "../marketplace/AcceptOfferModal";
import { FundraisingProofBadge } from "../garaga/FundraisingProofBadge";

const LOT_IMAGES = [
  "/images/cattle-angus.jpg",
  "/images/cattle-hereford.jpg",
  "/vaca-image-btc.png",
];

function getLotImage(lotId: number): string {
  return LOT_IMAGES[lotId % LOT_IMAGES.length];
}

const CATEGORY_MAP: Record<ProductionType, { label: string; key: string }> = {
  FEEDLOT: { label: "Fattening", key: "fattening" },
  PASTURE: { label: "Breeding", key: "breeding" },
  MIXED: { label: "Dairy", key: "dairy" },
};

const RISK_LEVELS: Record<string, { color: string; label: string }> = {
  low: { color: "bg-vaca-success", label: "Low" },
  medium: { color: "bg-vaca-warning", label: "Medium" },
  high: { color: "bg-vaca-error", label: "High" },
};

// --------------- Chart helpers ---------------

const CHART_W = 400;
const CHART_H = 100;
const START_Y = 85;
const MAX_GROWTH_PX = 70;
const CONSERVATIVE_FACTOR = 0.65;

function computeGrowthPath(returnPercent: number, numPoints = 7): string {
  const normalised = Math.min(returnPercent / 30, 1);
  const endY = START_Y - MAX_GROWTH_PX * normalised;
  const xStep = CHART_W / (numPoints - 1);

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const eased = 1 - Math.pow(1 - t, 2);
    points.push({ x: i * xStep, y: START_Y - (START_Y - endY) * eased });
  }

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const cpx = (points[i - 1].x + points[i].x) / 2;
    d += ` C${cpx},${points[i - 1].y} ${cpx},${points[i].y} ${points[i].x},${points[i].y}`;
  }
  return d;
}

function computeFillPath(linePath: string): string {
  return `${linePath} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;
}

function getMonthLabels(durationWeeks: number): string[] {
  const totalMonths = Math.max(1, Math.round(durationWeeks / 4.33));
  if (totalMonths <= 3)
    return Array.from({ length: totalMonths + 1 }, (_, i) => `M${i}`);
  const mid = Math.round(totalMonths / 2);
  return [`M1`, `M${mid}`, `M${totalMonths}`];
}

// --------------- Shared sub-components ---------------

function ProducerCard({
  producerName,
  producerVerified,
  farmName,
  producerExperience,
}: {
  producerName: string;
  producerVerified: boolean;
  farmName?: string | null;
  producerExperience?: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-vaca-green">
        <ShieldCheck className="h-6 w-6 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-playfair text-lg font-semibold text-vaca-neutral-gray-900">
            {producerName}
          </h3>
          {producerVerified && (
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
          {producerExperience && (
            <span className="font-inter text-xs text-vaca-neutral-gray-500">
              {producerExperience}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FundingProgressBar({
  progress,
  label,
}: {
  progress: number;
  label: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-inter text-xs font-semibold uppercase tracking-wider text-vaca-neutral-gray-400">
          {label}
        </span>
        <span className="font-inter text-sm font-bold text-vaca-neutral-gray-900">
          {progress.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-vaca-neutral-gray-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className="h-full rounded-full bg-gradient-to-r from-vaca-green to-vaca-green-light"
        />
      </div>
    </div>
  );
}

function PrivacyMetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl bg-vaca-green/5 p-5">
      <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
        {label}
      </p>
      <p className="mt-2 font-inter text-2xl font-bold text-vaca-neutral-gray-900">
        {value}
      </p>
      <p className="mt-1 font-inter text-xs text-vaca-neutral-gray-500">
        {hint}
      </p>
    </div>
  );
}

function P2POfferRow({ offer, onBuy }: { offer: OfferDto; onBuy: () => void }) {
  const remainingShares = offer.sharesAmount - offer.sharesFilled;
  const isStrk = offer.currency === "STRK";
  const price =
    isStrk && offer.strkPricePerShare
      ? `${formatStrkWei(offer.strkPricePerShare)} STRK`
      : `$${offer.pricePerShare}`;

  return (
    <div className="flex items-center justify-between rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-4">
      <div>
        <p className="font-inter text-sm font-semibold text-vaca-neutral-gray-900">
          {price}{" "}
          <span className="text-xs font-normal text-vaca-neutral-gray-400">
            / share
          </span>
        </p>
        <p className="mt-0.5 font-inter text-xs text-vaca-neutral-gray-400">
          {remainingShares} {remainingShares === 1 ? "share" : "shares"}{" "}
          available
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onBuy}
        className="flex items-center gap-1.5 rounded-xl bg-vaca-green px-4 py-2 font-inter text-sm font-bold text-white"
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        Buy
      </motion.button>
    </div>
  );
}

// --------------- Main Component ---------------

interface LotDetailScreenProps {
  lotId: number;
}

export function LotDetailScreen({ lotId }: LotDetailScreenProps) {
  const t = useTranslations("investor.lotDetail");
  const tCommon = useTranslations("common");

  const router = useRouter();
  const { data: lot, isPending } = useLot(lotId);
  const { data: p2pOffers } = useOffers({ lotId });
  const { data: portfolio } = usePortfolio();
  const [selectedOffer, setSelectedOffer] = useState<OfferDto | null>(null);

  const openOffers = p2pOffers ?? [];

  const chart = useMemo(() => {
    if (!lot) return null;
    const targetPath = computeGrowthPath(lot.investorPercent);
    const conservativePath = computeGrowthPath(
      lot.investorPercent * CONSERVATIVE_FACTOR,
    );
    const fillPath = computeFillPath(targetPath);
    const labels = getMonthLabels(lot.durationWeeks);
    return { targetPath, conservativePath, fillPath, labels };
  }, [lot]);

  if (isPending) return <LotDetailSkeleton />;

  if (!lot) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-playfair text-2xl font-semibold text-vaca-neutral-gray-900">
            {tCommon("errors.notFound")}
          </h2>
          <Link
            href="/marketplace"
            className="font-inter text-sm text-vaca-blue hover:underline"
          >
            ← {tCommon("actions.back")}
          </Link>
        </div>
      </div>
    );
  }

  const isPrimaryMarket = lot.status === "FUNDING";

  const metadata =
    lot.metadata && typeof lot.metadata === "object"
      ? (lot.metadata as Record<string, unknown>)
      : {};
  const getMetaString = (key: string, fallback = "") => {
    const value = metadata[key];
    return typeof value === "string" ? value : fallback;
  };

  const fundraisingProof =
    metadata.fundraisingProof &&
    typeof metadata.fundraisingProof === "object" &&
    (metadata.fundraisingProof as Record<string, unknown>).verified === true
      ? (metadata.fundraisingProof as {
          thresholdPercent: number;
          verified: boolean;
          txHash: string;
          provedAt: string;
        })
      : null;

  const imageUrl = getMetaString("imageUrl") || getLotImage(lotId);
  const category = CATEGORY_MAP[lot.productionType] ?? CATEGORY_MAP.FEEDLOT;
  const translatedCategory = t(`categories.${category.key}`);
  const riskLevel = getMetaString("riskLevel", "low").toLowerCase();
  const risk = RISK_LEVELS[riskLevel] ?? RISK_LEVELS.low;
  const fundingProgress =
    typeof lot.fundedPercent === "number" ? lot.fundedPercent : null;

  const producerName = lot.producer?.user?.name;
  const producerVerified = lot.producer?.status === "ACTIVE";
  const producerExperience = getMetaString("producerExperience");

  const detailRows = [
    { label: t("category"), value: translatedCategory },
    { label: t("herdSize"), value: lot.cattleCount.toLocaleString() },
    {
      label: t("duration"),
      value: lot.durationWeeks
        ? `${lot.durationWeeks} ${tCommon("time.weeks")}`
        : "—",
    },
    { label: t("location"), value: lot.location || "—" },
    { label: "Risk", value: risk.label, dot: risk.color },
  ];

  return (
    <div className="relative pb-36 lg:mx-auto lg:max-w-6xl lg:px-8 lg:pb-12">
      {/* ── Hero Image — mobile only ── */}
      <div className="relative h-[380px] w-full overflow-hidden lg:hidden">
        <Image
          src={imageUrl}
          alt={lot.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        <header className="absolute top-0 z-10 flex w-full items-center justify-between p-5">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30"
            aria-label={tCommon("actions.back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/30"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </header>
      </div>

      {/* ── Content ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "relative",
          "-mt-14 rounded-t-[2rem] bg-vaca-neutral-white px-7 pt-10 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]",
          "lg:-mt-0 lg:rounded-t-none lg:bg-transparent lg:px-0 lg:pt-8 lg:shadow-none",
        )}
      >
        <div className="lg:grid lg:grid-cols-5 lg:items-start lg:gap-10">
          {/* ════════════════════════════════════
              Main Column (left)
             ════════════════════════════════════ */}
          <div className="lg:col-span-3">
            {/* Desktop Title Row — thumbnail + title + back/share */}
            <motion.div
              variants={itemVariants}
              className="mb-8 hidden lg:block"
            >
              <button
                onClick={() => router.back()}
                className="mb-4 inline-flex items-center gap-1.5 font-inter text-sm font-medium text-vaca-neutral-gray-400 transition-colors hover:text-vaca-neutral-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                {tCommon("actions.back")}
              </button>

              <div className="flex items-start gap-5">
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src={imageUrl}
                    alt={lot.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex items-start justify-between gap-4">
                    <h1 className="font-playfair text-4xl leading-tight text-vaca-neutral-gray-900">
                      {lot.name}
                    </h1>
                    <button
                      className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-vaca-neutral-gray-100 text-vaca-neutral-gray-400 transition-colors hover:bg-vaca-neutral-gray-50 hover:text-vaca-neutral-gray-700"
                      aria-label="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <span className="font-inter text-[10px] font-bold uppercase tracking-[0.15em] text-vaca-neutral-gray-400">
                      Lot #{lot.id}
                    </span>
                    {lot.farmName && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-vaca-neutral-gray-200" />
                        <span className="font-inter text-[10px] font-bold uppercase tracking-[0.15em] text-vaca-neutral-gray-400">
                          {lot.farmName}
                        </span>
                      </>
                    )}
                    <span className="h-1 w-1 rounded-full bg-vaca-neutral-gray-200" />
                    <span className="rounded-full bg-vaca-green/10 px-2.5 py-0.5 font-inter text-[10px] font-bold uppercase tracking-wider text-vaca-green">
                      {translatedCategory}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Mobile Title */}
            <motion.div variants={itemVariants} className="mb-8 lg:hidden">
              <h1 className="font-playfair text-3xl leading-tight text-vaca-neutral-gray-900">
                {lot.name}
              </h1>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="font-inter text-[10px] font-bold uppercase tracking-[0.15em] text-vaca-neutral-gray-400">
                  Lot #{lot.id}
                </span>
                {lot.farmName && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-vaca-neutral-gray-200" />
                    <span className="font-inter text-[10px] font-bold uppercase tracking-[0.15em] text-vaca-neutral-gray-400">
                      {lot.farmName}
                    </span>
                  </>
                )}
              </div>
            </motion.div>

            {/* Metric Cards — mobile only */}
            <motion.div
              variants={itemVariants}
              className="mb-10 grid grid-cols-2 gap-4 lg:hidden"
            >
              <div className="rounded-2xl border border-vaca-neutral-gray-50 bg-vaca-neutral-white p-5 shadow-sm">
                <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
                  {t("expectedReturn")}
                </p>
                <p className="mt-2 font-inter text-3xl font-bold tracking-tight text-vaca-green">
                  {lot.investorPercent}%
                </p>
              </div>
              <div className="rounded-2xl border border-vaca-neutral-gray-50 bg-vaca-neutral-white p-5 shadow-sm">
                <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
                  {t("pricePerShare")}
                </p>
                <p className="mt-2 font-inter text-3xl font-bold tracking-tight text-vaca-blue">
                  ${lot.pricePerShare}
                </p>
              </div>
            </motion.div>

            {/* Projected Growth Chart */}
            {chart && (
              <motion.div
                variants={itemVariants}
                className="mb-12 lg:mb-8 lg:rounded-2xl lg:border lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-white lg:p-6"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="font-inter text-lg font-bold text-vaca-neutral-gray-900">
                      Projected Growth
                    </h2>
                    <div className="mt-1 flex gap-4">
                      <div className="flex items-center gap-1.5">
                        <span className="h-[2px] w-2 rounded-full bg-vaca-green" />
                        <span className="font-inter text-[10px] font-semibold uppercase tracking-wider text-vaca-neutral-gray-400">
                          Target ({lot.investorPercent}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-[2px] w-2 border-t border-dashed border-vaca-neutral-gray-300" />
                        <span className="font-inter text-[10px] font-semibold uppercase tracking-wider text-vaca-neutral-gray-400">
                          Conservative
                        </span>
                      </div>
                    </div>
                  </div>
                  {lot.durationWeeks > 0 && (
                    <span className="rounded-full bg-vaca-green/5 px-3 py-1.5 font-inter text-[10px] font-bold uppercase tracking-wider text-vaca-green">
                      {lot.durationWeeks} {tCommon("time.weeks")}
                    </span>
                  )}
                </div>

                <div className="relative h-44 w-full lg:h-52">
                  <svg
                    className="absolute bottom-0 left-0 h-full w-full"
                    preserveAspectRatio="none"
                    viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                  >
                    <defs>
                      <linearGradient
                        id="lotChartFill"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#1B5E20"
                          stopOpacity="0.12"
                        />
                        <stop
                          offset="100%"
                          stopColor="#1B5E20"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d={chart.conservativePath}
                      fill="none"
                      stroke="#D6D3D1"
                      strokeDasharray="4,4"
                      strokeLinecap="round"
                      strokeWidth="1.5"
                    />
                    <path d={chart.fillPath} fill="url(#lotChartFill)" />
                    <path
                      d={chart.targetPath}
                      fill="none"
                      stroke="#1B5E20"
                      strokeLinecap="round"
                      strokeWidth="2.5"
                    />
                  </svg>
                  <div className="absolute -bottom-7 flex w-full justify-between font-inter text-[10px] font-bold uppercase tracking-widest text-vaca-neutral-gray-400">
                    {chart.labels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Funding Progress — mobile only */}
            {fundingProgress !== null && (
              <motion.div
                variants={itemVariants}
                className="mb-4 mt-4 lg:hidden"
              >
                <FundingProgressBar
                  progress={fundingProgress}
                  label={t("fundingProgress")}
                />
                {fundraisingProof && (
                  <div className="mt-3">
                    <FundraisingProofBadge proof={fundraisingProof} />
                  </div>
                )}
              </motion.div>
            )}

            {/* Detail Rows */}
            <motion.div
              variants={itemVariants}
              className="lg:rounded-2xl lg:border lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-white lg:p-6"
            >
              <h3 className="hidden pb-4 font-playfair text-base font-semibold text-vaca-neutral-gray-900 lg:block">
                {t("category")} & Details
              </h3>
              <div className="space-y-0">
                {detailRows.map(({ label, value, dot }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-vaca-neutral-gray-50 py-3.5 last:border-b-0"
                  >
                    <span className="font-inter text-xs font-semibold uppercase tracking-wider text-vaca-neutral-gray-400">
                      {label}
                    </span>
                    <div className="flex items-center gap-2">
                      {dot && (
                        <span className={cn("h-2 w-2 rounded-full", dot)} />
                      )}
                      <span className="font-inter text-sm font-bold text-vaca-neutral-gray-900">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* P2P Offers — shown when lot is not accepting primary investment */}
            {!isPrimaryMarket && (
              <motion.div
                variants={itemVariants}
                className="mt-6 lg:mt-6 lg:rounded-2xl lg:border lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-white lg:p-6"
              >
                <h3 className="mb-4 font-inter text-base font-bold text-vaca-neutral-gray-900">
                  Available P2P Offers
                </h3>
                {openOffers.length > 0 ? (
                  <div className="space-y-3">
                    {openOffers.map((offer) => (
                      <P2POfferRow
                        key={offer.id}
                        offer={offer}
                        onBuy={() => setSelectedOffer(offer)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-vaca-neutral-gray-100">
                      <ShoppingCart className="h-5 w-5 text-vaca-neutral-gray-400" />
                    </div>
                    <p className="font-inter text-sm text-vaca-neutral-gray-500">
                      No P2P offers available for this lot right now.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Private funding summary — mobile only */}
            <motion.div
              variants={itemVariants}
              className="mt-10 rounded-2xl bg-vaca-green/5 p-5 lg:hidden"
            >
              <PrivacyMetricCard
                label={t("privateMetrics.title")}
                value={t("privateMetrics.hidden")}
                hint={t("privateMetrics.hint")}
              />
            </motion.div>

            {/* Producer — mobile only */}
            {producerName && (
              <motion.div
                variants={itemVariants}
                className="mt-6 rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 lg:hidden"
              >
                <ProducerCard
                  producerName={producerName}
                  producerVerified={producerVerified}
                  farmName={lot.farmName}
                  producerExperience={producerExperience}
                />
              </motion.div>
            )}

            <div className="h-8 lg:hidden" />
          </div>

          {/* ════════════════════════════════════
              Sidebar (right) — desktop only
             ════════════════════════════════════ */}
          <div className="hidden lg:col-span-2 lg:block">
            <div className="sticky top-8 space-y-6">
              {/* Investment Summary Card */}
              <motion.div
                variants={itemVariants}
                className="overflow-hidden rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white shadow-sm"
              >
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
                        {t("expectedReturn")}
                      </p>
                      <p className="mt-2 font-inter text-3xl font-bold tracking-tight text-vaca-green">
                        {lot.investorPercent}%
                      </p>
                    </div>
                    <div>
                      <p className="font-inter text-[9px] font-bold uppercase tracking-[0.2em] text-vaca-neutral-gray-400">
                        {t("pricePerShare")}
                      </p>
                      <p className="mt-2 font-inter text-3xl font-bold tracking-tight text-vaca-blue">
                        ${lot.pricePerShare}
                      </p>
                    </div>
                  </div>

                  <div className="my-5 border-t border-vaca-neutral-gray-50" />

                  <PrivacyMetricCard
                    label={t("privateMetrics.title")}
                    value={t("privateMetrics.hidden")}
                    hint={t("privateMetrics.hint")}
                  />

                  {fundingProgress !== null && (
                    <div className="mt-5">
                      <FundingProgressBar
                        progress={fundingProgress}
                        label={t("fundingProgress")}
                      />
                      {fundraisingProof && (
                        <div className="mt-3">
                          <FundraisingProofBadge proof={fundraisingProof} />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-vaca-neutral-gray-50 p-6">
                  {isPrimaryMarket ? (
                    <Link href={`/invest/${lotId}`}>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-vaca-green to-vaca-green-light font-inter text-base font-bold text-white shadow-xl shadow-vaca-green/30 transition-all"
                      >
                        {t("investButton")}
                        <TrendingUp className="h-4 w-4" />
                      </motion.button>
                    </Link>
                  ) : openOffers.length > 0 ? (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedOffer(openOffers[0])}
                      className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-vaca-green to-vaca-green-light font-inter text-base font-bold text-white shadow-xl shadow-vaca-green/30 transition-all"
                    >
                      Buy Best Offer
                      <ShoppingCart className="h-4 w-4" />
                    </motion.button>
                  ) : (
                    <div className="flex h-14 items-center justify-center rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-gray-50">
                      <p className="font-inter text-sm text-vaca-neutral-gray-400">
                        No P2P offers available
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Producer Card */}
              {producerName && (
                <motion.div
                  variants={itemVariants}
                  className="rounded-2xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5"
                >
                  <ProducerCard
                    producerName={producerName}
                    producerVerified={producerVerified}
                    farmName={lot.farmName}
                    producerExperience={producerExperience}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <AcceptOfferModal
        isOpen={!!selectedOffer}
        offer={selectedOffer}
        portfolio={portfolio}
        onClose={() => setSelectedOffer(null)}
      />

      {/* ── Fixed Bottom CTA — mobile only ── */}
      <div className="fixed bottom-[4.5rem] left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 lg:hidden">
        <div className="bg-gradient-to-t from-vaca-neutral-white via-vaca-neutral-white to-vaca-neutral-white/0 px-7 pb-4 pt-4">
          {isPrimaryMarket ? (
            <Link href={`/invest/${lotId}`}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.97 }}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-vaca-green to-vaca-green-light font-inter text-base font-bold text-white shadow-xl shadow-vaca-green/30 transition-all active:scale-[0.97]"
              >
                {t("investButton")}
                <TrendingUp className="h-4 w-4" />
              </motion.button>
            </Link>
          ) : openOffers.length > 0 ? (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedOffer(openOffers[0])}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-vaca-green to-vaca-green-light font-inter text-base font-bold text-white shadow-xl shadow-vaca-green/30 transition-all active:scale-[0.97]"
            >
              Buy Best Offer
              <ShoppingCart className="h-4 w-4" />
            </motion.button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LotDetailSkeleton() {
  return (
    <div className="animate-pulse lg:mx-auto lg:max-w-6xl lg:px-8">
      {/* Hero skeleton — mobile only */}
      <div className="h-[380px] w-full bg-vaca-neutral-gray-100 lg:hidden" />

      {/* Content skeleton */}
      <div className="relative -mt-14 rounded-t-[2rem] bg-vaca-neutral-white px-7 pt-10 lg:-mt-0 lg:rounded-t-none lg:bg-transparent lg:px-0 lg:pt-8">
        <div className="lg:grid lg:grid-cols-5 lg:items-start lg:gap-10">
          {/* Main column skeleton */}
          <div className="lg:col-span-3">
            {/* Desktop title row: thumbnail + title */}
            <div className="mb-8 hidden items-start gap-5 lg:flex">
              <div className="h-28 w-28 shrink-0 rounded-xl bg-vaca-neutral-gray-100" />
              <div className="flex-1 pt-1">
                <div className="h-10 w-64 rounded-lg bg-vaca-neutral-gray-100" />
                <div className="mt-3 h-3 w-32 rounded bg-vaca-neutral-gray-100" />
              </div>
            </div>

            {/* Mobile title */}
            <div className="mb-8 lg:hidden">
              <div className="mb-2 h-8 w-48 rounded-lg bg-vaca-neutral-gray-100" />
              <div className="h-3 w-24 rounded bg-vaca-neutral-gray-100" />
            </div>

            {/* Metric cards — mobile only */}
            <div className="mb-10 grid grid-cols-2 gap-4 lg:hidden">
              <div className="h-24 rounded-2xl bg-vaca-neutral-gray-100" />
              <div className="h-24 rounded-2xl bg-vaca-neutral-gray-100" />
            </div>

            {/* Chart skeleton */}
            <div className="mb-12 h-44 rounded-2xl bg-vaca-neutral-gray-100 lg:mb-8 lg:h-72" />

            {/* Detail rows skeleton */}
            <div className="space-y-3 lg:rounded-2xl lg:border lg:border-vaca-neutral-gray-100 lg:bg-vaca-neutral-white lg:p-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 rounded bg-vaca-neutral-gray-50" />
              ))}
            </div>

            {/* Lot value + Producer — mobile only */}
            <div className="mt-6 h-20 rounded-2xl bg-vaca-neutral-gray-100 lg:hidden" />
            <div className="mt-6 h-20 rounded-2xl bg-vaca-neutral-gray-100 lg:hidden" />
          </div>

          {/* Sidebar skeleton — desktop only */}
          <div className="hidden lg:col-span-2 lg:block">
            <div className="space-y-6">
              <div className="h-80 rounded-2xl bg-vaca-neutral-gray-100" />
              <div className="h-24 rounded-2xl bg-vaca-neutral-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

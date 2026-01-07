"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  MapPin,
  TrendingUp,
  Calendar,
  Award,
  CheckCircle,
  Package,
} from "lucide-react";
import Link from "next/link";
import { getLotById } from "../../_constants/mockData";
import { cn } from "~~/lib/utils/cn";

interface LotDetailScreenProps {
  lotId: string;
}

/**
 * LotDetailScreen (INV-09)
 * Detailed information about a specific cattle lot
 */
export function LotDetailScreen({ lotId }: LotDetailScreenProps) {
  const t = useTranslations("investor.lotDetail");
  const tCommon = useTranslations("common");

  const lot = getLotById(lotId);

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
            ← {tCommon("actions.back")} to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const getTranslatedCategory = (cat: string) => {
    switch (cat) {
      case "Breeding":
        return t("categories.breeding");
      case "Fattening":
        return t("categories.fattening");
      case "Dairy":
        return t("categories.dairy");
      default:
        return cat;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Breeding":
        return "bg-vaca-green/10 text-vaca-green";
      case "Fattening":
        return "bg-amber-50 text-amber-700";
      case "Dairy":
        return "bg-vaca-blue/10 text-vaca-blue";
      default:
        return "bg-vaca-neutral-gray-100 text-vaca-neutral-gray-600";
    }
  };

  return (
    <div className="relative pb-32">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 border-b border-vaca-neutral-gray-200 bg-vaca-neutral-white/90 backdrop-blur-lg">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 font-inter text-sm text-vaca-neutral-gray-600 transition-colors hover:text-vaca-green"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{tCommon("actions.back")}</span>
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative mb-6 h-72 overflow-hidden rounded-3xl">
            {lot.imageUrl ? (
              <img
                src={lot.imageUrl}
                alt={lot.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-vaca-green/20 via-vaca-blue/20 to-vaca-brown/20" />
            )}
            <div className="absolute right-4 top-4">
              <span
                className={cn(
                  "rounded-xl px-4 py-2 font-inter text-sm backdrop-blur-sm",
                  getCategoryColor(lot.category),
                )}
              >
                {lot.category}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="mb-2 font-playfair text-4xl font-bold text-vaca-green">
              {lot.name}
            </h1>
            <div className="flex items-center gap-2 font-inter text-vaca-neutral-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{lot.location}</span>
            </div>
          </div>
        </motion.div>

        {/* Financial Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 rounded-3xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-8"
        >
          <h2 className="mb-6 font-playfair text-2xl font-semibold text-vaca-green">
            Resumen Financiero
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="mb-2 font-inter text-sm text-vaca-neutral-gray-500">
                Lot Value
              </p>
              <p className="font-playfair text-3xl font-semibold text-vaca-green">
                ${lot.capitalRequired.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="mb-2 font-inter text-sm text-vaca-neutral-gray-500">
                {t("expectedReturn")}
              </p>
              <p className="flex items-center gap-2 font-playfair text-3xl font-semibold text-vaca-green">
                <TrendingUp className="h-6 w-6 text-amber-600" />
                {lot.expectedReturn}
              </p>
            </div>
            <div>
              <p className="mb-2 font-inter text-sm text-vaca-neutral-gray-500">
                {t("pricePerShare")}
              </p>
              <p className="font-playfair text-2xl font-semibold text-vaca-green">
                ${lot.pricePerShare}
              </p>
            </div>
            <div>
              <p className="mb-2 font-inter text-sm text-vaca-neutral-gray-500">
                {t("duration")}
              </p>
              <p className="font-playfair text-2xl font-semibold text-vaca-green">
                {lot.duration}
              </p>
            </div>
            <div>
              <p className="mb-2 font-inter text-sm text-vaca-neutral-gray-500">
                NAV Actual
              </p>
              <p className="font-playfair text-xl font-semibold text-vaca-green">
                ${lot.currentNAV.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="mb-2 font-inter text-sm text-vaca-neutral-gray-500">
                {t("sharesAvailable")}
              </p>
              <p className="font-playfair text-xl font-semibold text-vaca-green">
                {lot.sharesAvailable} de {lot.totalShares}
              </p>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="mt-8 border-t border-vaca-neutral-gray-200 pt-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-inter text-vaca-neutral-gray-600">
                {t("fundingProgress")}
              </span>
              <span className="font-inter font-medium text-vaca-green">
                {lot.fundingProgress.toFixed(0)}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-vaca-neutral-gray-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${lot.fundingProgress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full rounded-full bg-gradient-to-r from-vaca-green to-green-600"
              />
            </div>
          </div>
        </motion.div>

        {/* Production Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 rounded-3xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-8"
        >
          <h2 className="mb-6 font-playfair text-2xl font-semibold text-vaca-green">
            Información de Producción
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-vaca-green/10">
                <Package className="h-5 w-5 text-vaca-green" />
              </div>
              <div>
                <p className="mb-1 font-inter text-sm text-vaca-neutral-gray-500">
                  Raza
                </p>
                <p className="font-inter text-lg font-medium text-vaca-green">
                  {lot.breed}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-vaca-green/10">
                <TrendingUp className="h-5 w-5 text-vaca-green" />
              </div>
              <div>
                <p className="mb-1 font-inter text-sm text-vaca-neutral-gray-500">
                  Tamaño del Hato
                </p>
                <p className="font-inter text-lg font-medium text-vaca-green">
                  {lot.herdSize} cabezas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-vaca-green/10">
                <Calendar className="h-5 w-5 text-vaca-green" />
              </div>
              <div>
                <p className="mb-1 font-inter text-sm text-vaca-neutral-gray-500">
                  Categoría
                </p>
                <p className="font-inter text-lg font-medium text-vaca-green">
                  {getTranslatedCategory(lot.category)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-vaca-green/10">
                <MapPin className="h-5 w-5 text-vaca-green" />
              </div>
              <div>
                <p className="mb-1 font-inter text-sm text-vaca-neutral-gray-500">
                  Ubicación
                </p>
                <p className="font-inter text-lg font-medium text-vaca-green">
                  {lot.location}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Traceability Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 rounded-3xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white p-8"
        >
          <h2 className="mb-6 font-playfair text-2xl font-semibold text-vaca-brown">
            Trazabilidad
          </h2>
          <div className="space-y-6">
            {lot.traceabilityEvents.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex gap-4"
              >
                <div className="w-2 flex-shrink-0 rounded-full bg-vaca-brown" />
                <div className="flex-1 pb-6">
                  <div className="mb-2 flex items-start justify-between">
                    <p className="font-inter text-sm font-medium text-vaca-neutral-gray-500">
                      {event.date}
                    </p>
                  </div>
                  <p className="font-inter text-vaca-neutral-gray-700">
                    {event.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Producer Credibility */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl border border-vaca-neutral-gray-200 bg-gradient-to-br from-vaca-green/5 to-vaca-neutral-white p-8"
        >
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-vaca-green">
              <Award className="h-8 w-8 text-vaca-neutral-white" />
            </div>
            <div>
              <h2 className="mb-1 font-playfair text-2xl font-semibold text-vaca-green">
                {lot.producer.name}
              </h2>
              <p className="font-inter text-vaca-neutral-gray-600">
                {lot.producer.experience}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-3 font-inter text-sm text-vaca-neutral-gray-500">
              Experiencia Verificada
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-2 rounded-xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white px-4 py-2 font-inter text-sm text-vaca-green">
                <CheckCircle className="h-4 w-4 text-vaca-green" />
                Productor Verificado
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky CTA Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-vaca-neutral-gray-200 bg-vaca-neutral-white">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-inter text-sm text-vaca-neutral-gray-500">
                {t("pricePerShare").toLowerCase()}
              </p>
              <p className="font-playfair text-3xl font-semibold text-vaca-green">
                ${lot.pricePerShare}
              </p>
            </div>
            <Link href={`/invest/${lotId}`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl bg-vaca-green px-8 py-4 font-inter font-semibold text-vaca-neutral-white shadow-lg transition-colors hover:bg-green-700"
              >
                {t("investButton")}
              </motion.button>
            </Link>
          </div>
          <p className="text-center font-inter text-xs text-vaca-neutral-gray-500">
            Inversión sujeta a términos y condiciones • Riesgo de pérdida de
            capital
          </p>
        </div>
      </div>
    </div>
  );
}

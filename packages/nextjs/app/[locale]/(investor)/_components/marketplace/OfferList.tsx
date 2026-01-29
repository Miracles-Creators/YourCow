"use client";

import { motion } from "framer-motion";
import { ShoppingBag, AlertCircle } from "lucide-react";

import { OfferCard } from "./OfferCard";
import { cn } from "~~/lib/utils/cn";
import type { OfferDto } from "~~/lib/api/schemas";

export interface OfferListProps {
  offers: OfferDto[];
  isLoading?: boolean;
  error?: Error | null;
  onAccept?: (offer: OfferDto) => void;
  onCancel?: (offer: OfferDto) => void;
  currentUserId?: number;
  emptyMessage?: string;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};

/**
 * OfferList - Grid of marketplace offers
 * Handles loading, empty, and error states
 */
export function OfferList({
  offers,
  isLoading = false,
  error,
  onAccept,
  onCancel,
  currentUserId,
  emptyMessage = "No offers available at the moment",
  className,
}: OfferListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h3 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900 mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-vaca-neutral-gray-500 max-w-sm">
          {error.message || "Failed to load offers. Please try again later."}
        </p>
      </motion.div>
    );
  }

  // Empty state
  if (!offers || offers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-vaca-neutral-gray-100 flex items-center justify-center mb-4">
          <ShoppingBag className="h-8 w-8 text-vaca-neutral-gray-400" />
        </div>
        <h3 className="font-playfair text-xl font-semibold text-vaca-neutral-gray-900 mb-2">
          No offers yet
        </h3>
        <p className="text-sm text-vaca-neutral-gray-500 max-w-sm">{emptyMessage}</p>
      </motion.div>
    );
  }

  // Offers grid
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", className)}
    >
      {offers.map((offer) => (
        <motion.div key={offer.id} variants={itemVariants}>
          <OfferCard
            offer={offer}
            onAccept={onAccept}
            onCancel={onCancel}
            isOwner={currentUserId === offer.sellerId}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Loading skeleton for offer cards
 */
function LoadingSkeleton() {
  return (
    <div className="bg-vaca-neutral-white rounded-xl shadow-md overflow-hidden animate-pulse">
      {/* Header */}
      <div className="p-4 pb-0 flex items-start justify-between">
        <div className="flex-1">
          <div className="h-6 bg-vaca-neutral-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-vaca-neutral-gray-200 rounded w-1/2" />
        </div>
        <div className="h-6 w-16 bg-vaca-neutral-gray-200 rounded-full" />
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="h-4 bg-vaca-neutral-gray-200 rounded w-1/3 mb-2" />
        <div className="h-8 bg-vaca-neutral-gray-200 rounded w-1/2 mb-4" />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="h-16 bg-vaca-neutral-gray-100 rounded-lg" />
          <div className="h-16 bg-vaca-neutral-gray-100 rounded-lg" />
        </div>

        <div className="h-10 bg-vaca-neutral-gray-200 rounded-xl" />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-vaca-neutral-gray-50">
        <div className="h-4 bg-vaca-neutral-gray-200 rounded w-1/3 mx-auto" />
      </div>
    </div>
  );
}

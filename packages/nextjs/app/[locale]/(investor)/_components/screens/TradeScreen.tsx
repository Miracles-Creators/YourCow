"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

import { containerVariants, itemVariants } from "../animations";
import { SegmentedToggle } from "../marketplace/SegmentedToggle";
import { BalanceCard } from "../marketplace/BalanceCard";
import { OfferList } from "../marketplace/OfferList";
import { SellPositionList } from "../marketplace/SellPositionList";
import { FiatDepositModal } from "../marketplace/FiatDepositModal";
import { CreateOfferModal } from "../marketplace/CreateOfferModal";
import { AcceptOfferModal } from "../marketplace/AcceptOfferModal";
import { FundModal } from "../tongo/FundModal";
import { WithdrawModal } from "../tongo/WithdrawModal";

import { useOffers, usePortfolio, useCancelOffer } from "~~/hooks/marketplace";
import { useTongoBalance } from "~~/hooks/tongo";
import { useMe } from "~~/hooks/auth/useMe";
import type { OfferDto, PortfolioLotPositionDto } from "~~/lib/api/schemas";

type TradeTab = "fiat" | "crypto";
type BuySellTab = "buy" | "sell";

export function TradeScreen() {
  const t = useTranslations("investor.trade");

  const [activeTab, setActiveTab] = useState<TradeTab>("fiat");
  const [buySellTab, setBuySellTab] = useState<BuySellTab>("buy");
  const [selectedOffer, setSelectedOffer] = useState<OfferDto | null>(null);
  const [showCreateOffer, setShowCreateOffer] = useState(false);
  const [showFiatDeposit, setShowFiatDeposit] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedPosition, setSelectedPosition] =
    useState<PortfolioLotPositionDto | null>(null);

  const currency = activeTab === "fiat" ? "ARS" : "STRK";
  const {
    data: offers,
    isPending: offersLoading,
    error: offersError,
  } = useOffers({ currency });
  const { data: portfolio, isPending: portfolioLoading } = usePortfolio();
  const { data: tongoBalance } = useTongoBalance();
  const { data: me } = useMe();
  const cancelOffer = useCancelOffer();

  const fiatAvailableCentavos = useMemo(() => {
    const arsBalance = portfolio?.fiat?.find((b) => b.currency === "ARS");
    return Number(arsBalance?.available ?? 0);
  }, [portfolio]);

  const strkBalance = tongoBalance?.current ?? "0";

  const allPositions = useMemo(() => portfolio?.lots ?? [], [portfolio]);

  const handleAcceptOffer = (offer: OfferDto) => {
    setSelectedOffer(offer);
  };

  const handleCancelOffer = (offer: OfferDto) => {
    cancelOffer.mutate(offer.id);
  };

  const handleSellPosition = (position: PortfolioLotPositionDto) => {
    setSelectedPosition(position);
    setShowCreateOffer(true);
  };

  const isFiat = activeTab === "fiat";
  const emptyMessage = isFiat ? t("noFiatOffers") : t("noCryptoOffers");

  const tradeTabOptions = useMemo(
    () => [
      { value: "fiat" as const, label: t("fiatTab") },
      { value: "crypto" as const, label: t("cryptoTab") },
    ],
    [t],
  );

  const buySellOptions = useMemo(
    () => [
      { value: "buy" as const, label: t("buy") },
      { value: "sell" as const, label: t("sell") },
    ],
    [t],
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 pb-24"
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-playfair text-2xl font-bold text-vaca-neutral-gray-900">
          {t("title")}
        </h1>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SegmentedToggle
          options={tradeTabOptions}
          activeValue={activeTab}
          onChange={setActiveTab}
          variant="pill"
          layoutId="trade-tab-pill"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <BalanceCard
          activeTab={activeTab}
          fiatAvailableCentavos={fiatAvailableCentavos}
          strkBalance={strkBalance}
          isLoading={portfolioLoading}
          onDeposit={() => setShowFiatDeposit(true)}
          onFund={() => setShowFundModal(true)}
          onWithdraw={() => setShowWithdrawModal(true)}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <div
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm ${
            isFiat
              ? "bg-vaca-green/5 text-vaca-green"
              : "bg-vaca-brown/5 text-vaca-brown"
          }`}
        >
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>{isFiat ? t("feeInfo") : t("feeInfoCrypto")}</span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <SegmentedToggle
          options={buySellOptions}
          activeValue={buySellTab}
          onChange={setBuySellTab}
          variant="underline"
          layoutId="buy-sell-underline"
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        {buySellTab === "buy" ? (
          <>
            <p className="text-sm font-medium text-vaca-neutral-gray-500 mb-3">
              {t("availableOffers")}
            </p>
            <OfferList
              key={currency}
              offers={offers ?? []}
              isLoading={offersLoading}
              error={offersError}
              onAccept={handleAcceptOffer}
              onCancel={handleCancelOffer}
              currentUserId={me?.id}
              emptyMessage={emptyMessage}
            />
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-vaca-neutral-gray-500 mb-3">
              {t("yourPositions")}
            </p>
            <SellPositionList
              positions={allPositions}
              isLoading={portfolioLoading}
              onSell={handleSellPosition}
            />
          </>
        )}
      </motion.div>

      <FiatDepositModal
        isOpen={showFiatDeposit}
        onClose={() => setShowFiatDeposit(false)}
      />

      <FundModal
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
      />

      <WithdrawModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
      />

      <AcceptOfferModal
        isOpen={!!selectedOffer}
        onClose={() => setSelectedOffer(null)}
        offer={selectedOffer}
        portfolio={portfolio}
      />

      {selectedPosition && (
        <CreateOfferModal
          isOpen={showCreateOffer}
          onClose={() => {
            setShowCreateOffer(false);
            setSelectedPosition(null);
          }}
          lotId={selectedPosition.lotId}
          lotName={selectedPosition.lotName ?? `Lot #${selectedPosition.lotId}`}
          position={selectedPosition}
          defaultCurrency={isFiat ? "ARS" : "STRK"}
        />
      )}
    </motion.div>
  );
}

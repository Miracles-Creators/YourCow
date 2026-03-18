/**
 * Investor Components - Feature-based colocation
 * All investor-specific components in one place
 */

// Animations
export {
  containerVariants,
  itemVariants,
  slowContainerVariants,
  slowItemVariants,
  overlayVariants,
  modalVariants,
} from "./animations";

// UI Components
export { Logo, CowLogo } from "./ui/Logo";
export { PrimaryButton } from "./ui/PrimaryButton";
export { TrustBadge } from "./ui/TrustBadge";
export { InvestmentCard } from "./ui/InvestmentCard";
export { PortfolioValueChart } from "./ui/PortfolioValueChart";
export { BottomNav } from "./ui/BottomNav";
export { SideNav } from "./ui/SideNav";
export { TopBar } from "./ui/TopBar";
export { WalletBar } from "./ui/WalletBar";
export { PositionCard } from "./ui/PositionCard";

// Layouts
export { InvestorLayout } from "./layouts/InvestorLayout";

// Garaga Components
export { FundraisingProofBadge } from "./garaga/FundraisingProofBadge";
export { PrivacyProofCard } from "./ui/PrivacyProofCard";

// Tongo Components
export { TongoBalanceCard } from "./tongo/TongoBalanceCard";
export { FundModal } from "./tongo/FundModal";
export { WithdrawModal } from "./tongo/WithdrawModal";

// Screens
export { WelcomeScreen } from "./screens/WelcomeScreen";
export { LoginScreen } from "./screens/LoginScreen";
export { DashboardScreen } from "./screens/DashboardScreen";
export { MarketplaceScreen } from "./screens/MarketplaceScreen";
export { LotDetailScreen } from "./screens/LotDetailScreen";
export { InvestAmountScreen } from "./screens/InvestAmountScreen";
export { PositionDetailScreen } from "./screens/PositionDetailScreen";
export { ConfirmInvestmentScreen } from "./screens/ConfirmInvestmentScreen";
export { InvestmentSuccessScreen } from "./screens/InvestmentSuccessScreen";
export { TradeScreen } from "./screens/TradeScreen";

// Marketplace Components
export { OfferList } from "./marketplace/OfferList";
export { OfferCard } from "./marketplace/OfferCard";
export { AcceptOfferModal } from "./marketplace/AcceptOfferModal";
export { CreateOfferModal } from "./marketplace/CreateOfferModal";
export { BalanceCard } from "./marketplace/BalanceCard";
export { SegmentedToggle } from "./marketplace/SegmentedToggle";
export { SellPositionList } from "./marketplace/SellPositionList";
export { FiatDepositModal } from "./marketplace/FiatDepositModal";

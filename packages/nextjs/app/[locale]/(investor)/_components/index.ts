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
} from "./animations";

// UI Components
export { Logo, CowLogo } from "./ui/Logo";
export { PrimaryButton } from "./ui/PrimaryButton";
export { TrustBadge } from "./ui/TrustBadge";
export { InvestmentCard } from "./ui/InvestmentCard";
export { PortfolioValueChart } from "./ui/PortfolioValueChart";
export { BottomNav } from "./ui/BottomNav";
export { TopBar } from "./ui/TopBar";
export { PositionCard } from "./ui/PositionCard";

// Layouts
export { InvestorLayout } from "./layouts/InvestorLayout";

// Tongo Components
export { TongoBalanceCard } from "./tongo/TongoBalanceCard";
export { FundModal } from "./tongo/FundModal";
export { WithdrawModal } from "./tongo/WithdrawModal";

// Screens
export { WelcomeScreen } from "./screens/WelcomeScreen";
export { LoginScreen } from "./screens/LoginScreen";
export { DashboardScreen } from "./screens/DashboardScreen";
export { MarketplaceScreen } from "./screens/MarketplaceScreen";
export { P2PScreen } from "./screens/P2PScreen";
export { LotDetailScreen } from "./screens/LotDetailScreen";
export { InvestAmountScreen } from "./screens/InvestAmountScreen";
export { PositionDetailScreen } from "./screens/PositionDetailScreen";
export { ConfirmInvestmentScreen } from "./screens/ConfirmInvestmentScreen";
export { InvestmentSuccessScreen } from "./screens/InvestmentSuccessScreen";

# Investor Feature - YourCow

Investor-facing screens for retail cattle investment platform.

## 📁 Structure (Feature-based Colocation)

```
app/(investor)/
├── _components/          # Private folder - all investor components
│   ├── ui/              # Investor-specific UI primitives
│   │   ├── Logo.tsx
│   │   ├── PrimaryButton.tsx (branded with vaca-* colors)
│   │   └── TrustBadge.tsx
│   ├── screens/         # Full screen components
│   │   ├── WelcomeScreen.tsx (INV-01)
│   │   └── LoginScreen.tsx (INV-02)
│   ├── layouts/
│   │   └── InvestorLayout.tsx (background, orbs, grain)
│   └── index.ts         # Barrel exports
├── welcome/
│   └── page.tsx         # Route: /welcome
├── login/
│   └── page.tsx         # Route: /login
└── layout.tsx           # Shared investor layout + metadata
```

## 🎯 Why This Structure?

### Route Group `(investor)`
- ✅ URLs are clean: `/welcome` not `/investor/welcome`
- ✅ Shared layout applied to all screens
- ✅ Logical grouping without URL nesting

### Private Folder `_components`
- ✅ Next.js ignores for routing (not public)
- ✅ Everything investor-related in ONE place
- ✅ Easy to find, easy to maintain

### Feature-based Organization
- ✅ Add new investor screen? Just add `_components/screens/NewScreen.tsx`
- ✅ No jumping between `/app/` and `/components/` folders
- ✅ Self-contained feature module

## 🔄 Adding New Investor Screens

**Example: INV-03 Portfolio Screen**

```bash
# 1. Create screen component
app/(investor)/_components/screens/PortfolioScreen.tsx

# 2. Export from index
app/(investor)/_components/index.ts

# 3. Create route
app/(investor)/portfolio/page.tsx
```

```tsx
// app/(investor)/portfolio/page.tsx
import { PortfolioScreen } from "../_components/screens/PortfolioScreen";

export default function PortfolioPage() {
  return <PortfolioScreen />;
}
```

## 🎨 Design System

Uses centralized design tokens:
- **Colors**: `lib/constants/brand.ts` → `vaca-green`, `vaca-blue`, etc.
- **Fonts**: `lib/fonts.ts` → Playfair Display + Inter
- **Animations**: Framer Motion variants in screens

## 🌐 Routes

- `/welcome` - Welcome screen (INV-01)
- `/login` - Email login (INV-02)

## 🔗 Shared vs Feature-specific

**Investor-specific** (stays here):
- Logo, PrimaryButton, TrustBadge (all branded)
- InvestorLayout
- All screens

**Shared across app** (goes in `/components/ui/`):
- Generic Button, Input, Card (no branding)
- Shared utilities

## 📚 Learn More

- [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)
- [Next.js Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)

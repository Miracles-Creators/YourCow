# YourCow - Frontend Architecture

**Last Updated:** January 2026
**Framework:** Next.js 15 (App Router)
**Styling:** Tailwind CSS v4 + DaisyUI
**Language:** TypeScript

---

## 📐 Core Principles

1. **Feature-based Colocation** - Group code by feature, not by type
2. **Route Groups** - Organize routes logically without affecting URLs
3. **Private Folders** - Use `_folder` for internal organization (excluded from routing)
4. **Design System First** - Centralized tokens, no hardcoded values
5. **Atomic Components** - Build from primitives up to complex screens
6. **Type Safety** - Full TypeScript, no `any` types
7. **Accessibility** - WCAG 2.1 AA compliance minimum

---

## 📁 Project Structure

```
packages/nextjs/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (minimal, i18n wrapper)
│   │
│   └── [locale]/                     # 🌍 Dynamic locale segment (en, es)
│       ├── layout.tsx                # Locale layout (providers, global styles)
│       ├── page.tsx                  # Homepage
│       │
│       ├── (investor)/               # ← FEATURE: Investor screens
│       │   ├── _components/          # Private folder (investor components)
│       │   │   ├── ui/               # Investor-branded UI components
│       │   │   ├── screens/          # Full screen components
│       │   │   ├── layouts/          # Feature-specific layouts
│       │   │   └── index.ts          # Barrel exports
│       │   ├── welcome/page.tsx      # Route: /en/welcome
│       │   ├── login/page.tsx        # Route: /en/login
│       │   ├── marketplace/page.tsx  # Route: /en/marketplace
│       │   ├── portfolio/page.tsx    # Route: /en/portfolio
│       │   └── layout.tsx            # Shared investor layout + metadata
│       │
│       ├── (producer)/               # ← FEATURE: Producer screens
│       │   ├── _components/          # Private folder (producer components)
│       │   │   ├── ui/               # Producer-specific UI components
│       │   │   ├── screens/          # Full screen components
│       │   │   ├── layouts/          # Feature-specific layouts
│       │   │   └── index.ts          # Barrel exports
│       │   └── producer/             # Producer routes
│       │       └── lots/             # Lot management routes
│       │
│       ├── (admin)/                  # ← FEATURE: Admin screens
│       │   ├── _components/          # Private folder (admin components)
│       │   │   ├── ui/               # Admin-specific UI components
│       │   │   ├── screens/          # Full screen components
│       │   │   ├── layouts/          # Feature-specific layouts
│       │   │   └── index.ts          # Barrel exports
│       │   ├── admin/                # Admin routes (URL: /admin/...)
│       │   │   ├── dashboard/page.tsx
│       │   │   ├── lots/
│       │   │   ├── producers/
│       │   │   ├── settlements/
│       │   │   ├── updates/
│       │   │   └── support/
│       │   └── layout.tsx            # Shared admin layout + metadata
│       │
│       ├── debug/                    # Debug/development screens
│       ├── blockexplorer/            # Block explorer screens
│       └── api/                      # API routes
│
├── components/                        # 🔷 SHARED across ALL features
│   ├── ui/                           # Generic, reusable UI primitives
│   │   ├── Button.tsx                # Base button (variants, sizes, colors)
│   │   ├── Card.tsx                  # Base card (variants, accents)
│   │   ├── Badge.tsx                 # Status badge/pill
│   │   ├── ProgressBar.tsx           # Progress indicator
│   │   ├── Input.tsx                 # Form input
│   │   ├── Section.tsx               # Content section wrapper
│   │   └── index.ts                  # Barrel exports
│   ├── scaffold-stark/               # Starknet integration components
│   ├── Header.tsx                    # Global header
│   └── Footer.tsx                    # Global footer
│
├── lib/                              # Core application logic
│   ├── constants/                    # Design tokens & configuration
│   │   └── brand.ts                  # Colors, typography, copy
│   ├── utils/                        # Utility functions
│   │   └── cn.ts                     # Tailwind class merger
│   ├── fonts.ts                      # next/font configuration
│   └── i18n/                         # Internationalization
│       ├── config.ts                 # i18n configuration
│       ├── routing.ts                # Locale routing
│       └── request.ts                # Server-side locale handling
│
├── hooks/                            # Shared React hooks
├── services/                         # Business logic & API clients
├── types/                            # TypeScript type definitions
├── utils/                            # Helper functions
├── messages/                         # 🌍 Translation files
│   ├── en.json                       # English translations
│   └── es.json                       # Spanish translations
├── styles/
│   └── globals.css                   # Global styles (Tailwind + DaisyUI themes)
├── public/                           # Static assets
└── contracts/                        # Smart contract configs
```

---

## 🌍 Internationalization (i18n)

### URL Structure

All routes include a locale segment:

```
/en/welcome        → English welcome page
/es/welcome        → Spanish welcome page
/en/marketplace    → English marketplace
/es/portfolio      → Spanish portfolio
```

### How It Works

1. **Dynamic Segment**: `app/[locale]/` captures the locale
2. **next-intl**: Handles translations and locale detection
3. **Messages**: Stored in `messages/{locale}.json`

### Using Translations

```tsx
import { useTranslations } from 'next-intl';

export function WelcomeScreen() {
  const t = useTranslations('investor.welcome');
  return <h1>{t('tagline')}</h1>;
}
```

---

## 🎯 Component Architecture

### Shared Primitives (`components/ui/`)

Generic components used across ALL features. No feature-specific styling.

| Component | Purpose | Usage |
|-----------|---------|-------|
| `Button` | Base button with variants, sizes, color schemes | `<Button variant="primary" colorScheme="green">` |
| `Card` | Container with accents, padding, variants | `<Card accent="green" variant="elevated">` |
| `Badge` | Status indicator with tones | `<Badge tone="success">Active</Badge>` |
| `ProgressBar` | Progress with animation support | `<ProgressBar value={75} color="green" />` |
| `Input` | Form input with label, error states | `<Input label="Email" error="Required" />` |
| `Section` | Content section with title, divider | `<Section title="Details" accent="brown">` |

**Usage:**
```tsx
import { Button, Card, Badge } from "~/components/ui";

// Feature components compose these primitives
export function InvestorCard() {
  return (
    <Card accent="green" variant="elevated">
      <Badge tone="success">Active</Badge>
      <Button colorScheme="green">Invest</Button>
    </Card>
  );
}
```

### Feature Components (`app/[locale]/(feature)/_components/`)

Feature-specific components that compose shared primitives.

```tsx
// app/[locale]/(investor)/_components/ui/PrimaryButton.tsx
import { Button } from "~/components/ui";

export function PrimaryButton(props) {
  return (
    <Button
      colorScheme="green"
      icon={<Arrow />}
      {...props}
    />
  );
}
```

---

## 🎨 Design System

### Tailwind Configuration

Colors defined in `tailwind.config.ts`:

```typescript
colors: {
  vaca: {
    green: { DEFAULT: '#1B5E20', dark: '#0D4715', light: '#2E7D32' },
    blue: { DEFAULT: '#4FC3F7', light: '#81D4FA', dark: '#0288D1' },
    brown: { DEFAULT: '#8D6E63', light: '#A1887F', dark: '#5D4037' },
    neutral: { bg: '#FAFAF8', white: '#FFFFFF', gray: { 50-900 } },
  },
}
```

### Using Design Tokens

```tsx
// ✅ GOOD - Use design tokens
<div className="bg-vaca-green text-vaca-neutral-bg">

// ❌ BAD - Hardcoded colors
<div className="bg-[#1B5E20]">
```

### Typography

Fonts configured in `lib/fonts.ts`:

```tsx
import { inter, playfair } from "~~/lib/fonts";

<h1 className="font-playfair">Headline</h1>
<p className="font-inter">Body text</p>
```

### CSS Organization

**`styles/globals.css`** contains:
1. DaisyUI theme configuration (light/dark)
2. CSS custom properties for scaffold UI
3. Base styles (html, body, typography)
4. Scaffold/debug utilities (not used in investor/producer)

**Key principle:** YourCow features use Tailwind classes, NOT the scaffold utilities.

---

## 📦 Import Patterns

### Barrel Exports

Each `_components/` folder has an `index.ts`:

```typescript
// app/[locale]/(investor)/_components/index.ts
export { WelcomeScreen } from "./screens/WelcomeScreen";
export { PrimaryButton } from "./ui/PrimaryButton";
export { InvestorLayout } from "./layouts/InvestorLayout";
```

### Clean Imports

```tsx
// ✅ GOOD - Barrel imports
import { WelcomeScreen, PrimaryButton } from "../_components";
import { Button, Card } from "~/components/ui";

// ❌ BAD - Deep imports
import { WelcomeScreen } from "../_components/screens/WelcomeScreen";
```

### Path Aliases

```typescript
// tsconfig.json
"paths": { "~~/*": ["./*"] }

// Usage
import { cn } from "~~/lib/utils/cn";
import { Button } from "~~/components/ui";
```

---

## 🚀 Route Groups Explained

### What are Route Groups?

Folders wrapped in parentheses `(name)` are **excluded from the URL path**.

```
app/[locale]/
├── (investor)/
│   └── welcome/page.tsx       → URL: /en/welcome (not /en/investor/welcome)
├── (producer)/
│   └── producer/page.tsx      → URL: /en/producer
└── (admin)/
    └── admin/dashboard/page.tsx → URL: /en/admin/dashboard
```

### Why Use Them?

1. **Organization** - Group related routes logically
2. **Shared Layouts** - Apply layout to specific routes
3. **Clean URLs** - No nested paths in URLs

---

## 🔒 Private Folders (`_folder`)

Folders prefixed with `_` are **ignored by the router**.

```
app/[locale]/(investor)/
├── _components/     # ← Private (not routed)
├── _hooks/          # ← Private (not routed)
├── _constants/      # ← Private (not routed)
└── welcome/page.tsx # ← Public (routed as /en/welcome)
```

---

## 📝 Naming Conventions

### Files

```
PascalCase.tsx     # Components
camelCase.ts       # Utilities, hooks
kebab-case/        # Route folders
UPPER_CASE.md      # Documentation
```

### Components

```tsx
// PascalCase for components
export function PrimaryButton() {}

// camelCase for hooks
export function useInvestorAuth() {}

// camelCase for utilities
export function formatCurrency() {}
```

---

## 🔄 State Management

### Local State

Use React hooks for component-specific state:

```tsx
function LoginScreen() {
  const [email, setEmail] = useState('');
}
```

### Global State

Use **Zustand** for cross-component state:

```typescript
// lib/store/investorStore.ts
import { create } from 'zustand';

export const useInvestorStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

### Server State

Use Next.js Server Components or React Query for server data.

---

## 📱 Responsive Design

### Breakpoints

```typescript
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
```

### Mobile-First

```tsx
<div className="
  px-4 py-6           // Mobile (default)
  sm:px-6 sm:py-8     // Tablet
  lg:px-8 lg:py-12    // Desktop
">
```

---

## ♿ Accessibility

All components MUST meet **WCAG 2.1 AA** minimum.

### Required Practices

1. **Semantic HTML** - Use `<button>`, `<nav>`, `<main>`
2. **ARIA labels** - Add `aria-label` to icons
3. **Focus management** - Visible focus rings
4. **Color contrast** - 4.5:1 minimum for text
5. **Keyboard navigation** - All interactions work without mouse

```tsx
// ✅ GOOD
<button
  onClick={handleClick}
  aria-label="Submit form"
  className="focus-visible:ring-2"
>

// ❌ BAD
<div onClick={handleClick}>
```

---

## 🎭 Animation Guidelines

Use **Framer Motion** for animations.

### Standard Patterns

```tsx
// Page mount animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
>

// Button hover
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
>
```

### Rules

- Use `transform` and `opacity` only (performance)
- Respect `prefers-reduced-motion`
- Keep animations subtle (fintech, not crypto)
- Standard easing: `[0.4, 0, 0.2, 1]`

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't

```tsx
// Hardcoding colors
<div className="bg-[#1B5E20]">

// Wrong component location
components/investor/Logo.tsx

// Deep imports
import { Logo } from "../_components/ui/Logo";

// Using `any`
function Button(props: any) {}

// Non-semantic HTML
<div onClick={handleClick}>
```

### ✅ Do

```tsx
// Use design tokens
<div className="bg-vaca-green">

// Feature-based colocation
app/[locale]/(investor)/_components/ui/Logo.tsx

// Barrel imports
import { Logo } from "../_components";

// Typed props
function Button({ children }: { children: ReactNode }) {}

// Semantic HTML
<button onClick={handleClick}>
```

---

## 🗂️ Folder Decision Tree

**"Where does this file go?"**

```
START
  ↓
Is it a route (URL)?
  ├─ YES → app/[locale]/([feature])/[route-name]/page.tsx
  └─ NO → Continue
       ↓
Is it used by MULTIPLE features?
  ├─ YES → components/ui/[ComponentName].tsx
  └─ NO → Continue
       ↓
Is it feature-specific UI?
  ├─ YES → app/[locale]/([feature])/_components/ui/[ComponentName].tsx
  └─ NO → Continue
       ↓
Is it a full screen?
  ├─ YES → app/[locale]/([feature])/_components/screens/[ScreenName].tsx
  └─ NO → Continue
       ↓
Is it a layout wrapper?
  ├─ YES → app/[locale]/([feature])/_components/layouts/[LayoutName].tsx
  └─ NO → Continue
       ↓
Is it a utility function?
  ├─ YES → lib/utils/[utilityName].ts
  └─ NO → Continue
       ↓
Is it a translation?
  └─ YES → messages/[locale].json
```

---

## 🎯 Adding New Features

### Example: Adding Admin Feature

**Step 1:** Create route group and route segment

```bash
mkdir -p app/\[locale\]/\(admin\)/_components/{ui,screens,layouts}
mkdir -p app/\[locale\]/\(admin\)/admin
```

**Step 2:** Create layout

```tsx
// app/[locale]/(admin)/layout.tsx
import { AdminLayout } from "./_components/layouts/AdminLayout";

export default function AdminRootLayout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
```

**Step 3:** Create screen

```tsx
// app/[locale]/(admin)/_components/screens/DashboardScreen.tsx
import { Card, Button } from "~/components/ui";

export function DashboardScreen() {
  return (
    <Card>
      <h1>Admin Dashboard</h1>
      <Button colorScheme="green">Action</Button>
    </Card>
  );
}
```

**Step 4:** Create route (note: inside `admin/` folder for URL prefix)

```tsx
// app/[locale]/(admin)/admin/dashboard/page.tsx → URL: /en/admin/dashboard
import { DashboardScreen } from "../../_components";

export default function DashboardPage() {
  return <DashboardScreen />;
}
```

**Step 5:** Add barrel exports

```tsx
// app/[locale]/(admin)/_components/index.ts
export { DashboardScreen } from "./screens/DashboardScreen";
export { AdminLayout } from "./layouts/AdminLayout";
```

---

## 📚 Key Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [next-intl Docs](https://next-intl-docs.vercel.app/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** January 2026
**Maintained by:** YourCow Engineering Team

# Frontend Architecture — Agent Reference

> **Purpose**: Deterministic guide for AI agents building features in this Next.js app.
> Read this BEFORE writing any code. Every rule here is enforced — violations will break patterns.

---

## Tech Stack

| Layer          | Technology                                              | Version     |
| -------------- | ------------------------------------------------------- | ----------- |
| Framework      | Next.js (App Router)                                    | 15          |
| Language       | TypeScript (strict)                                     | 5.x         |
| Styling        | Tailwind CSS                                            | 4.x         |
| State (server) | TanStack React Query                                    | 5.x         |
| State (client) | Zustand                                                 | 4.x         |
| Animations     | Framer Motion                                           | 12.x        |
| Validation     | Zod                                                     | 3.x         |
| i18n           | next-intl                                               | 4.x         |
| Blockchain     | starknet.js + @starknet-react                           | 8.5.3 / 5.x |
| Icons          | lucide-react, @heroicons/react                          | —           |
| Fonts          | Inter (body), Playfair Display (headings) via next/font | —           |

---

## Folder Structure

```
packages/nextjs/
├── app/
│   ├── layout.tsx                    # Root layout (no providers — just redirect)
│   ├── page.tsx                      # Root page (redirect to /[locale])
│   ├── api/                          # API routes (Next.js Route Handlers)
│   │   └── price/route.ts
│   └── [locale]/                     # i18n wrapper (en, es)
│       ├── layout.tsx                # Providers: ReactQuery, NextIntl, Theme, Starknet
│       ├── page.tsx                  # Landing page
│       ├── (investor)/               # Route group — investor-facing screens
│       │   ├── layout.tsx            # InvestorLayout wrapper + fonts
│       │   ├── _components/          # PRIVATE — colocated with this route group
│       │   │   ├── index.ts          # Barrel exports for ALL investor components
│       │   │   ├── animations.ts     # Shared animation variants
│       │   │   ├── screens/          # Full-page screen components
│       │   │   ├── ui/               # Feature-specific UI primitives
│       │   │   ├── layouts/          # Layout wrappers (InvestorLayout)
│       │   │   ├── marketplace/      # Sub-feature components
│       │   │   ├── tongo/            # Sub-feature components
│       │   │   └── garaga/           # Sub-feature components
│       │   ├── dashboard/page.tsx
│       │   ├── marketplace/page.tsx
│       │   ├── lot/[id]/page.tsx
│       │   └── ...
│       ├── (admin)/                  # Route group — admin screens
│       │   ├── layout.tsx
│       │   ├── _components/
│       │   │   ├── index.ts
│       │   │   ├── screens/
│       │   │   ├── ui/
│       │   │   └── layouts/
│       │   └── admin/dashboard/page.tsx
│       ├── (producer)/               # Route group — producer screens
│       │   ├── layout.tsx
│       │   ├── _components/
│       │   │   ├── index.ts
│       │   │   ├── screens/
│       │   │   ├── ui/
│       │   │   └── layouts/
│       │   └── producer/page.tsx
│       ├── (onboarding)/             # Route group — registration flow
│       │   ├── layout.tsx
│       │   ├── _components/
│       │   │   ├── index.ts
│       │   │   ├── screens/
│       │   │   └── ui/
│       │   └── onboarding/.../page.tsx
│       ├── blockexplorer/            # Standalone feature (no route group)
│       ├── configure/
│       └── debug/
│
├── components/                       # SHARED across all route groups
│   ├── ui/                           # Generic primitives (Button, Card, Badge, Input, etc.)
│   │   └── index.ts                  # Barrel exports
│   ├── scaffold-stark/               # Starknet scaffold components (wallet, address, etc.)
│   ├── ScaffoldStarkAppWithProviders.tsx
│   ├── ReactQueryProvider.tsx
│   ├── ThemeProvider.tsx
│   └── LanguageSwitcher.tsx
│
├── hooks/                            # Shared custom hooks (organized by domain)
│   ├── auth/                         # useLogin, useMe, useLinkWallet
│   ├── lots/                         # useLots, useLot, useCreateLot, useApproveLot
│   ├── animals/                      # useAnimalsByLot, useCreateAnimal, useApproveAnimals
│   ├── producers/                    # useProducers, useProducer, useCreateProducer
│   ├── payments/                     # useCreatePayment, useConfirmPayment, useFiatDeposit
│   ├── settlements/                  # useSettlements, useCreateSettlement, useConfirmSettlement
│   ├── marketplace/                  # useOffers, usePortfolio, useBuyPrimary, etc.
│   │   └── index.ts                  # All marketplace hooks in one barrel file
│   ├── shareTransfers/
│   ├── audit/
│   ├── garaga/
│   ├── tongo/
│   ├── scaffold-stark/               # Starknet scaffold hooks
│   ├── blockexplorer/
│   └── useAccount.ts, useScrollLock.ts
│
├── lib/                              # Pure logic, no React
│   ├── api/                          # Backend API client layer
│   │   ├── client.ts                 # apiFetch<T>() — base HTTP client
│   │   ├── schemas.ts                # Zod schemas + type exports (single source of truth)
│   │   ├── lots.ts                   # listLots, getLot, createLot, approveLot
│   │   ├── auth.ts
│   │   ├── marketplace.ts
│   │   ├── payments.ts
│   │   ├── producers.ts
│   │   ├── animals.ts
│   │   ├── settlements.ts
│   │   ├── shareTransfers.ts
│   │   ├── audit.ts
│   │   ├── garaga.ts
│   │   └── tongo.ts
│   ├── constants/
│   │   └── brand.ts                  # Brand colors, typography constants
│   ├── fonts.ts                      # next/font definitions (Inter, Playfair)
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── request.ts
│   │   └── routing.ts               # Locale config: ['en', 'es'], default 'es'
│   └── utils/
│       └── cn.ts                     # clsx + tailwind-merge utility
│
├── services/                         # Client-side services
│   ├── store/                        # Zustand stores
│   │   ├── store.ts                  # Global state (network, currency price)
│   │   ├── lotDraft.ts               # Lot creation wizard state
│   │   ├── onboarding.ts             # Onboarding flow state
│   │   └── history.ts
│   └── web3/                         # Blockchain client-side services
│       ├── connectors.tsx            # Wallet connectors
│       ├── provider.ts               # RPC provider
│       ├── PriceService.ts
│       ├── faucet.ts
│       └── websocket.ts
│
├── contracts/                        # On-chain contract configs
│   ├── deployedContracts.ts          # Contract addresses + ABIs (auto-generated)
│   ├── configExternalContracts.ts
│   └── predeployedContracts.ts
│
├── utils/                            # Legacy utilities (scaffold-stark inherited)
│   ├── scaffold-stark/               # Scaffold framework utilities
│   ├── blockexplorer/
│   ├── Constants.ts
│   ├── investment.ts
│   └── profile.ts
│
├── types/                            # Shared TypeScript types
│   ├── utils.ts
│   └── window.d.ts
│
├── styles/
│   └── globals.css                   # Tailwind directives + global styles
│
├── messages/                         # i18n translation files
│   ├── en.json
│   └── es.json
│
├── middleware.ts                      # next-intl middleware (locale routing)
├── tailwind.config.ts                # Brand colors (vaca-*), fonts, animations
├── scaffold.config.ts                # Scaffold-Stark config
└── supportedChains.ts
```

---

## Core Patterns

### 1. Page = Thin Shell, Screen = All Logic

**Pages are server components** that only render metadata + the screen component.
**Screens are client components** (`"use client"`) that contain all UI logic.

```tsx
// app/[locale]/(investor)/dashboard/page.tsx — THIN
import type { Metadata } from "next";
import { DashboardScreen } from "../_components/screens/DashboardScreen";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <DashboardScreen />;
}
```

```tsx
// app/[locale]/(investor)/_components/screens/DashboardScreen.tsx — ALL LOGIC
"use client";

import { usePortfolioSummary } from "~~/hooks/marketplace";

export function DashboardScreen() {
  const { data, isPending } = usePortfolioSummary();
  if (isPending) return <DashboardSkeleton />;
  if (!data) return <EmptyDashboard />;
  return <div>...</div>;
}

// Skeleton and Empty components defined in the SAME file (not separate files)
function DashboardSkeleton() { ... }
function EmptyDashboard() { ... }
```

**Rules**:

- Pages: NO `"use client"`, NO hooks, NO state. Only metadata + `<ScreenComponent />`
- Screens: named `*Screen.tsx`, always `"use client"`, always in `_components/screens/`
- Every screen handles its own loading, empty, and error states **inline** (as private functions in same file)
- Use named exports (`export function`), not default exports

### 2. Route Groups = Feature Boundaries

Route groups `(investor)`, `(admin)`, `(producer)`, `(onboarding)` are feature boundaries.
They do NOT appear in the URL (`/dashboard` not `/investor/dashboard`).

Each route group owns:

- Its own `layout.tsx` (wraps with feature-specific layout component)
- Its own `_components/` directory (PRIVATE — not importable outside the group)
- Its own barrel `index.ts` that exports everything

**Layout pattern**:

```tsx
// app/[locale]/(investor)/layout.tsx
import { InvestorLayout } from "./_components/layouts/InvestorLayout";

export default function InvestorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${playfair.variable} font-inter`}>
      <InvestorLayout>{children}</InvestorLayout>
    </div>
  );
}
```

### 3. Component Organization Inside `_components/`

```
_components/
├── index.ts          # Barrel exports — EVERYTHING goes through here
├── animations.ts     # Shared framer-motion variants
├── screens/          # Full-page components (one per route)
├── ui/               # Feature-specific primitives (buttons, cards, pills)
├── layouts/          # Layout wrappers (sidebar + topbar + content)
└── <sub-feature>/    # Group related components (marketplace/, tongo/)
```

**Import rule**: Always import from the barrel, never deep-path.

```tsx
// CORRECT
import { DashboardScreen, PrimaryButton, Logo } from "../_components";

// WRONG
import { Logo } from "../_components/ui/Logo";
```

### 4. Shared vs Feature-Specific Components

| Question                      | Location                                   |
| ----------------------------- | ------------------------------------------ |
| Used by 2+ route groups?      | `components/ui/`                           |
| Used by only one route group? | `app/(feature)/_components/ui/`            |
| Is it a full page?            | `app/(feature)/_components/screens/`       |
| Is it a layout shell?         | `app/(feature)/_components/layouts/`       |
| Is it a sub-feature cluster?  | `app/(feature)/_components/<sub-feature>/` |

`components/ui/` contains **unbranded primitives**: Button, Card, Badge, Input, ProgressBar, Section.
Feature components compose these with brand styling.

### 5. Data Flow: lib/api → hooks → screens

**Three-layer pattern** — never skip a layer:

```
lib/api/schemas.ts    → Zod schemas + types (SINGLE source of truth for ALL types)
lib/api/<domain>.ts   → apiFetch calls, returns Zod-parsed data
hooks/<domain>/       → React Query wrappers (useQuery/useMutation)
screens/              → Consume hooks, render UI
```

**API client** (`lib/api/client.ts`):

```tsx
// Thin wrapper — all API calls go through this
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}
```

**API domain file** (`lib/api/lots.ts`):

```tsx
import { apiFetch } from "./client";
import { LotSchema, type LotDto } from "./schemas";

export async function listLots(): Promise<LotDto[]> {
  const lots = await apiFetch<LotDto[]>("/lots");
  return LotSchema.array().parse(lots); // Always validate with Zod
}
```

**Hook** (`hooks/lots/useLots.ts`):

```tsx
export function useLots() {
  const { isPending, data, error } = useQuery({
    queryKey: ["lots"],
    queryFn: listLots,
    staleTime: 60_000,
  });
  return { isPending, data, error };
}
```

**Mutations invalidate related queries**:

```tsx
export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });
}
```

**Schema rules** (`lib/api/schemas.ts`):

- ALL Zod schemas live in this ONE file
- Types are inferred: `export type LotDto = z.infer<typeof LotSchema>`
- API functions always parse responses through schemas
- Input types can be defined in the domain file if simple

### 6. Styling

**Tailwind only** — no CSS modules, no styled-components, no inline styles.

**Brand color tokens** (defined in `tailwind.config.ts`):

```
vaca-green           #1B5E20    primary, trust
vaca-green-dark      #0D4715    hover states
vaca-green-light     #2E7D32    lighter variant
vaca-green-lighter   #4CAF50    lightest
vaca-gold            #9d9858    accents, CTAs
vaca-gold-light      rgba(...)  gold backgrounds
vaca-blue            #4FC3F7    secondary, liquidity
vaca-brown           #8D6E63    real assets, earth
vaca-error           #DC2626    errors
vaca-success         #059669    success
vaca-warning         #D97706    warnings
vaca-neutral-bg      #FAFAF8    page background
vaca-neutral-white   #FFFFFF
vaca-neutral-gray-{50-900}      text, borders, surfaces
```

**Utility**: `cn()` from `lib/utils/cn.ts` (clsx + tailwind-merge).

**Fonts**: `font-inter` (body), `font-playfair` (headings) — applied via CSS variables from `lib/fonts.ts`.

**Rules**:

- NEVER hardcode hex colors — use `vaca-*` tokens
- Mobile-first: base styles for mobile, `lg:` for desktop
- Use `cn()` for conditional classes
- Responsive pattern: `className="px-4 py-3 lg:px-8 lg:py-6"`

### 7. Animations

Standard variants defined in `_components/animations.ts`:

- `containerVariants` / `slowContainerVariants` — stagger children
- `itemVariants` / `slowItemVariants` — fade in + slide up

Apply to screens:

```tsx
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  <motion.div variants={itemVariants}>...</motion.div>
</motion.div>
```

**Rules**: Subtle only. Transform/opacity only. No bounce, no shake, no delays > 1s.
Standard easing: `[0.4, 0, 0.2, 1]`.

### 8. i18n

- Locales: `en`, `es` (default: `es`)
- URL format: `/en/dashboard`, `/es/dashboard`
- Translation files: `messages/en.json`, `messages/es.json`
- Usage: `const t = useTranslations("investor.dashboard");` then `t("stats.currentValue")`
- Navigation: import `{ Link, useRouter, usePathname }` from `~~/lib/i18n/routing`
- Middleware: `middleware.ts` handles locale detection and routing

### 9. State Management

| Type                 | Tool                 | Location                                      |
| -------------------- | -------------------- | --------------------------------------------- |
| Server data          | React Query          | `hooks/<domain>/`                             |
| Global client state  | Zustand              | `services/store/store.ts`                     |
| Feature wizard state | Zustand              | `services/store/lotDraft.ts`, `onboarding.ts` |
| URL state            | Next.js searchParams | In page/screen components                     |

React Query is the primary state manager. Zustand is used sparingly for cross-component client state that doesn't come from the server.

### 10. Blockchain Integration

- Wallet connection: `@starknet-react/core` providers in `ScaffoldStarkAppWithProviders`
- Contract ABIs + addresses: `contracts/deployedContracts.ts`
- Scaffold hooks: `hooks/scaffold-stark/` (useScaffoldReadContract, useScaffoldWriteContract)
- Custom wallet hook: `hooks/useAccount.ts`

### 11. Provider Stack

The `[locale]/layout.tsx` wraps children with this provider hierarchy:

```
ReactQueryProvider
  └── NextIntlClientProvider
        └── ThemeProvider
              └── ScaffoldStarkAppWithProviders (Starknet wallet providers)
                    └── {children}
```

---

## Adding a New Feature — Step by Step

### New screen in existing route group

1. Create screen: `app/[locale]/(feature)/_components/screens/NewScreen.tsx` (with `"use client"`)
2. Create page: `app/[locale]/(feature)/new-route/page.tsx` (thin shell, server component)
3. Export from barrel: add to `_components/index.ts`
4. Add translations: add keys to `messages/en.json` and `messages/es.json`

### New API endpoint consumption

1. Add Zod schema to `lib/api/schemas.ts`
2. Add API function to `lib/api/<domain>.ts` (use `apiFetch` + Zod parse)
3. Create hook in `hooks/<domain>/use<Name>.ts` (useQuery or useMutation)
4. Use hook in screen component

### New shared UI component

1. Create in `components/ui/NewComponent.tsx` (with TypeScript interface for props)
2. Export from `components/ui/index.ts`
3. Use `cn()` for class merging, `vaca-*` tokens for colors

### New feature-specific UI component

1. Create in `app/[locale]/(feature)/_components/ui/NewComponent.tsx`
2. Export from `app/[locale]/(feature)/_components/index.ts`

### New sub-feature cluster

1. Create directory: `app/[locale]/(feature)/_components/<sub-feature>/`
2. Add component files inside
3. Export all from `_components/index.ts`

### New route group (new user role)

1. Create `app/[locale]/(newrole)/layout.tsx`
2. Create `app/[locale]/(newrole)/_components/` with `index.ts`, `screens/`, `ui/`, `layouts/`
3. Create layout component in `layouts/`
4. Add routes as `(newrole)/<route>/page.tsx`

### New Zustand store

1. Create in `services/store/<name>.ts`
2. Use `create<Type>()` from zustand
3. Keep stores small and focused on one concern

### New domain hook folder

1. Create `hooks/<domain>/`
2. One hook per file: `use<Action>.ts`
3. If many hooks, create `index.ts` barrel that exports all

---

## File Placement Decision Tree

```
Is it a route (URL)?
  YES → app/[locale]/(feature)/<route>/page.tsx

Is it used by 2+ route groups?
  YES → components/ui/<Name>.tsx

Is it a full screen?
  YES → app/[locale]/(feature)/_components/screens/<Name>Screen.tsx

Is it feature-specific UI?
  YES → app/[locale]/(feature)/_components/ui/<Name>.tsx

Is it a layout wrapper?
  YES → app/[locale]/(feature)/_components/layouts/<Name>.tsx

Is it a sub-feature cluster?
  YES → app/[locale]/(feature)/_components/<sub-feature>/<Name>.tsx

Is it a React Query hook?
  YES → hooks/<domain>/use<Name>.ts

Is it an API function?
  YES → lib/api/<domain>.ts

Is it a Zod schema/type?
  YES → lib/api/schemas.ts (ALL schemas in one file)

Is it a utility function?
  YES → lib/utils/<name>.ts

Is it a Zustand store?
  YES → services/store/<name>.ts

Is it a constant/config?
  YES → lib/constants/<name>.ts
```

---

## Naming Conventions

| Thing           | Convention                 | Example                |
| --------------- | -------------------------- | ---------------------- |
| Component files | PascalCase.tsx             | `DashboardScreen.tsx`  |
| Hook files      | camelCase.ts               | `useLots.ts`           |
| Utility files   | camelCase.ts               | `cn.ts`                |
| Route folders   | kebab-case                 | `lot-detail/`          |
| Barrel exports  | index.ts                   | `_components/index.ts` |
| Zod schemas     | PascalCase + Schema suffix | `LotSchema`            |
| Types           | PascalCase + Dto suffix    | `LotDto`               |
| Hooks           | use + PascalCase           | `useLots()`            |
| Screens         | PascalCase + Screen suffix | `DashboardScreen`      |

---

## Validation Commands

```bash
yarn check-types    # TypeScript validation (tsc --noEmit)
yarn build          # Production build
yarn dev            # Dev server (localhost:3000)
yarn lint           # ESLint
yarn test           # Vitest
```

---

## Anti-Patterns — NEVER Do These

| Anti-Pattern                            | Correct Pattern                                     |
| --------------------------------------- | --------------------------------------------------- |
| Put feature components in `components/` | Use `app/(feature)/_components/`                    |
| Import from deep paths                  | Import from barrel `_components/index.ts`           |
| Hardcode hex colors                     | Use `vaca-*` Tailwind tokens                        |
| Use `any` type                          | Define proper interfaces                            |
| Add `"use client"` to page.tsx          | Pages are server components; screen is client       |
| Skip loading/empty states               | Every screen handles isPending + empty              |
| Create new CSS files                    | Use Tailwind classes only                           |
| Put API types next to hooks             | Types live in `lib/api/schemas.ts`                  |
| Use fetch directly in components        | Go through `lib/api/` → `hooks/` → component        |
| Mix route group concerns                | Each `(group)` owns its own `_components/`          |
| Create default exports for components   | Use named exports: `export function Name()`         |
| Put skeleton/empty in separate files    | Define them as private functions in the screen file |
| Skip Zod parsing in API functions       | Always validate: `Schema.parse(response)`           |

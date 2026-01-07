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
├── app/                          # Next.js App Router (routing only)
│   ├── (investor)/              # ← FEATURE: Investor screens
│   │   ├── _components/         # Private folder (all investor components)
│   │   │   ├── ui/              # Investor-branded UI primitives
│   │   │   ├── screens/         # Full screen components
│   │   │   ├── layouts/         # Feature-specific layouts
│   │   │   └── index.ts         # Barrel exports
│   │   ├── welcome/page.tsx     # Route: /welcome
│   │   ├── login/page.tsx       # Route: /login
│   │   └── layout.tsx           # Shared layout + metadata
│   │
│   ├── (admin)/                 # ← FUTURE: Admin screens
│   ├── (operator)/              # ← FUTURE: Operator screens
│   ├── api/                     # API routes
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Homepage
│
├── components/                   # Shared across ALL features
│   ├── ui/                      # Generic, reusable UI components
│   │   └── index.ts             # (Button, Input, Card, etc.)
│   ├── scaffold-stark/          # Starknet integration components
│   ├── Header.tsx               # Global header
│   └── Footer.tsx               # Global footer
│
├── lib/                          # Core application logic
│   ├── constants/               # Design tokens & configuration
│   │   └── brand.ts             # Colors, typography, copy
│   ├── utils/                   # Utility functions
│   │   └── cn.ts                # Tailwind class merger
│   └── fonts.ts                 # next/font configuration
│
├── hooks/                        # Shared React hooks
├── services/                     # Business logic & API clients
├── types/                        # TypeScript type definitions
├── utils/                        # Helper functions
├── styles/
│   └── globals.css              # Global styles (Tailwind imports)
├── public/                       # Static assets
└── contracts/                    # Smart contract configs
```

---

## 🎯 Where Does Each Thing Go?

### **Feature-Specific Code** → `app/(feature)/_components/`

Use when: Component is ONLY used within that feature

```
app/(investor)/_components/
├── ui/
│   ├── Logo.tsx                # Investor-branded logo
│   ├── PrimaryButton.tsx       # Uses vaca-* colors (investor-specific)
│   └── TrustBadge.tsx          # Investor-only trust indicator
├── screens/
│   ├── WelcomeScreen.tsx       # Full INV-01 screen
│   └── LoginScreen.tsx         # Full INV-02 screen
└── layouts/
    └── InvestorLayout.tsx      # Investor background/wrapper
```

**Rule:** If it references investor-specific branding (`vaca-*` colors, investor copy), it stays in `(investor)/_components/`.

---

### **Shared Components** → `components/ui/`

Use when: Component is used across MULTIPLE features (investor, admin, operator)

```
components/ui/
├── Button.tsx                  # Generic button (NO branding)
├── Input.tsx                   # Generic input
├── Card.tsx                    # Generic card
├── Modal.tsx                   # Generic modal
└── Badge.tsx                   # Generic badge
```

**Rule:** These are primitives. No feature-specific logic or styling.

**Example:**
```tsx
// ❌ BAD - Hardcoded investor colors
export function Button() {
  return <button className="bg-vaca-green">...</button>
}

// ✅ GOOD - Generic, accepts color via props
export function Button({ variant = "primary" }) {
  const styles = variant === "primary" ? "bg-primary" : "bg-secondary";
  return <button className={styles}>...</button>
}
```

---

### **Design Tokens** → `lib/constants/`

Use when: Defining colors, typography, spacing, copy, configuration

```typescript
// lib/constants/brand.ts
export const BRAND_COLORS = {
  green: { DEFAULT: '#1B5E20', ... },
  blue: { DEFAULT: '#4FC3F7', ... },
};

export const BRAND_COPY = {
  name: 'YourCow',
  tagline: 'Invest in real cattle assets',
};
```

**Rule:** ONE source of truth. Import from here, never hardcode.

---

### **Utilities** → `lib/utils/`

Use when: Pure functions with no side effects

```typescript
// lib/utils/cn.ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// lib/utils/formatCurrency.ts
export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
```

**Rule:** Stateless, testable, reusable.

---

### **Business Logic** → `services/`

Use when: API calls, data fetching, external integrations

```typescript
// services/auth.ts
export async function sendMagicLink(email: string) {
  const response = await fetch('/api/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return response.json();
}
```

**Rule:** Keep business logic OUT of components. Components call services.

---

### **Types** → `types/` or colocated

Use when: Shared TypeScript interfaces

```typescript
// types/investor.ts
export interface Investor {
  id: string;
  email: string;
  portfolioValue: number;
}
```

**Rule:** Feature-specific types can live in `app/(feature)/_types/`. Shared types go in `/types/`.

---

## 🎨 Design System

### **Tailwind Configuration**

Colors are defined in `tailwind.config.ts`:

```typescript
colors: {
  vaca: {
    green: { DEFAULT: '#1B5E20', dark: '#0D4715', light: '#2E7D32' },
    blue: { DEFAULT: '#4FC3F7', light: '#81D4FA', dark: '#0288D1' },
    brown: { DEFAULT: '#8D6E63', light: '#A1887F', dark: '#5D4037' },
    neutral: { bg: '#FAFAF8', ... },
  },
}
```

**Usage in components:**
```tsx
<div className="bg-vaca-green text-vaca-neutral-bg">
  Branded investor button
</div>
```

### **Typography**

Fonts configured in `lib/fonts.ts` using `next/font`:

```typescript
import { Inter, Playfair_Display } from "next/font/google";

export const inter = Inter({ ... });
export const playfair = Playfair_Display({ ... });
```

Applied globally in layouts:
```tsx
<div className={`${inter.variable} ${playfair.variable}`}>
  <h1 className="font-playfair">Headline</h1>
  <p className="font-inter">Body text</p>
</div>
```

### **Component Styling Rules**

1. **Tailwind ONLY** - No CSS-in-JS, no inline styles
2. **Use `cn()` utility** - Merge classes properly
3. **Design tokens** - Use `vaca-*` colors, never hex codes
4. **Responsive first** - Mobile breakpoints (`sm:`, `md:`, `lg:`)
5. **Dark mode ready** - Use theme-aware classes when needed

```tsx
import { cn } from "~~/lib/utils/cn";

export function MyComponent({ className }: { className?: string }) {
  return (
    <div className={cn(
      "bg-vaca-green rounded-xl px-4 py-2", // base styles
      "hover:bg-vaca-green-light transition-colors", // interactions
      "sm:px-6 sm:py-3", // responsive
      className, // allow overrides
    )}>
      ...
    </div>
  );
}
```

---

## 🚀 Route Groups Explained

### What are Route Groups?

Folders wrapped in parentheses `(name)` are **excluded from the URL path**.

```
app/
├── (investor)/
│   ├── welcome/page.tsx  → URL: /welcome (not /investor/welcome)
│   └── login/page.tsx    → URL: /login
└── (admin)/
    └── dashboard/page.tsx → URL: /dashboard (not /admin/dashboard)
```

### Why Use Them?

1. **Organization** - Group related routes logically
2. **Shared Layouts** - Apply layout to specific routes
3. **Clean URLs** - No nested paths in URLs

### When to Use Route Groups?

- ✅ Different user types (investor, admin, operator)
- ✅ Different layouts (authenticated vs public)
- ✅ Feature grouping (marketing, docs, app)

---

## 🔒 Private Folders (`_folder`)

### What are Private Folders?

Folders prefixed with `_` are **ignored by the router**.

```
app/(investor)/
├── _components/     # ← Private (not routed)
├── _hooks/          # ← Private (not routed)
├── _utils/          # ← Private (not routed)
└── welcome/page.tsx # ← Public (routed as /welcome)
```

### Why Use Them?

1. **Colocation** - Keep components next to routes that use them
2. **Encapsulation** - Internal implementation details
3. **Cleaner structure** - No accidentally routed files

### When to Use Private Folders?

- ✅ Feature-specific components
- ✅ Feature-specific hooks
- ✅ Feature-specific utilities
- ✅ Internal types/constants

---

## 📦 Component Architecture

### Atomic Design Hierarchy

```
Atoms (primitives)
  ↓
Molecules (simple combinations)
  ↓
Organisms (complex UI blocks)
  ↓
Screens (full pages)
```

**Example:**

```tsx
// Atom - components/ui/Button.tsx
export function Button({ children }: { children: ReactNode }) {
  return <button className="...">{children}</button>;
}

// Molecule - app/(investor)/_components/ui/PrimaryButton.tsx
import { Button } from "~/components/ui/Button";
export function PrimaryButton({ children }: { children: ReactNode }) {
  return <Button className="bg-vaca-green">{children}</Button>;
}

// Organism - app/(investor)/_components/ui/LoginForm.tsx
import { PrimaryButton } from "./PrimaryButton";
export function LoginForm() {
  return (
    <form>
      <input type="email" />
      <PrimaryButton>Login</PrimaryButton>
    </form>
  );
}

// Screen - app/(investor)/_components/screens/LoginScreen.tsx
import { LoginForm } from "../ui/LoginForm";
export function LoginScreen() {
  return (
    <div>
      <h1>Welcome Back</h1>
      <LoginForm />
    </div>
  );
}
```

---

## 🎭 Animation Guidelines

Use **Framer Motion** for animations (already in dependencies).

### When to Animate?

1. **Page transitions** - Fade in, slide up on mount
2. **User feedback** - Button hover, form submission
3. **State changes** - Loading → Success → Error
4. **Micro-interactions** - Icon hover effects

### Animation Rules

1. **Performance** - Use `transform` and `opacity` only
2. **Subtlety** - Animations should enhance, not distract
3. **Accessibility** - Respect `prefers-reduced-motion`
4. **Consistency** - Use standard easing curves

```tsx
"use client";
import { motion } from "framer-motion";

export function AnimatedScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      Content
    </motion.div>
  );
}
```

---

## ♿ Accessibility Standards

All components MUST meet **WCAG 2.1 AA** minimum.

### Required Practices

1. **Semantic HTML** - Use `<button>`, `<nav>`, `<main>`, etc.
2. **ARIA labels** - Add `aria-label` to icons, `aria-hidden` to decorative elements
3. **Focus management** - Visible focus rings, logical tab order
4. **Color contrast** - Minimum 4.5:1 for text, 3:1 for UI elements
5. **Keyboard navigation** - All interactions work without mouse

```tsx
// ❌ BAD
<div onClick={handleClick}>Click me</div>

// ✅ GOOD
<button
  onClick={handleClick}
  aria-label="Submit form"
  className="focus-visible:ring-2 focus-visible:ring-vaca-green"
>
  Click me
</button>
```

---

## 🧪 Testing Strategy

### Component Tests

Use **Vitest** + **Testing Library** (already configured).

```typescript
// app/(investor)/_components/ui/__tests__/Logo.test.tsx
import { render, screen } from '@testing-library/react';
import { Logo } from '../Logo';

describe('Logo', () => {
  it('renders brand name', () => {
    render(<Logo />);
    expect(screen.getByText('YourCow')).toBeInTheDocument();
  });
});
```

### Coverage Requirements

- ✅ UI components: 80%+ coverage
- ✅ Utilities: 100% coverage
- ✅ Services: 90%+ coverage

---

## 📝 Naming Conventions

### Files

```
PascalCase.tsx     # Components
camelCase.ts       # Utilities, hooks
kebab-case.css     # Stylesheets
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

### CSS Classes

```tsx
// Tailwind utility classes (as-is)
<div className="bg-vaca-green px-4 py-2" />

// Custom classes: kebab-case
<div className="investor-card" />
```

---

## 🔄 State Management

### Local State

Use React hooks (`useState`, `useReducer`) for component-specific state.

```tsx
function LoginScreen() {
  const [email, setEmail] = useState('');
  // Component-specific state
}
```

### Global State

Use **Zustand** (already in dependencies) for cross-component state.

```typescript
// lib/store/investorStore.ts
import { create } from 'zustand';

interface InvestorStore {
  user: User | null;
  setUser: (user: User) => void;
}

export const useInvestorStore = create<InvestorStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

### Server State

Use **React Query** or Next.js Server Components for server data.

---

## 📱 Responsive Design

### Breakpoints

```typescript
// Tailwind default breakpoints
sm: 640px   // Mobile landscape
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
```

### Mobile-First

Always design for mobile, then enhance for desktop.

```tsx
<div className="
  px-4 py-6           // Mobile: small padding
  sm:px-6 sm:py-8     // Tablet: medium padding
  lg:px-8 lg:py-12    // Desktop: large padding
">
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This

1. **Hardcoding values**
   ```tsx
   <div className="bg-[#1B5E20]"> // ❌ Use bg-vaca-green
   ```

2. **Mixing component locations**
   ```
   components/investor/Logo.tsx    // ❌
   app/(investor)/_components/ui/Logo.tsx  // ✅
   ```

3. **Creating non-atomic components**
   ```tsx
   // ❌ BAD - Too much in one file
   function LoginScreenWithFormAndValidation() {}

   // ✅ GOOD - Separated
   function LoginScreen() {
     return <LoginForm />;
   }
   function LoginForm() {}
   ```

4. **Skipping TypeScript types**
   ```tsx
   function Button(props: any) {} // ❌
   function Button({ children }: { children: ReactNode }) {} // ✅
   ```

5. **Not using barrel exports**
   ```tsx
   import { Logo } from "../_components/ui/Logo"; // ❌
   import { Logo } from "../_components"; // ✅
   ```

---

## 🎯 Adding New Features

### Example: Adding Admin Feature

**Step 1:** Create route group
```bash
mkdir -p app/\(admin\)/_components/{ui,screens,layouts}
```

**Step 2:** Create layout
```tsx
// app/(admin)/layout.tsx
import { AdminLayout } from "./_components/layouts/AdminLayout";

export default function AdminRootLayout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
```

**Step 3:** Create first screen
```tsx
// app/(admin)/_components/screens/DashboardScreen.tsx
export function DashboardScreen() {
  return <div>Admin Dashboard</div>;
}
```

**Step 4:** Create route
```tsx
// app/(admin)/dashboard/page.tsx
import { DashboardScreen } from "../_components/screens/DashboardScreen";

export default function DashboardPage() {
  return <DashboardScreen />;
}
```

**Step 5:** Add barrel exports
```tsx
// app/(admin)/_components/index.ts
export { DashboardScreen } from "./screens/DashboardScreen";
export { AdminLayout } from "./layouts/AdminLayout";
```

---

## 📚 Key Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/)

---

## 🆘 Need Help?

1. **Check this doc first** - Most questions answered here
2. **Read `claude.md`** - AI-specific instructions
3. **Review existing code** - See `app/(investor)/` for reference
4. **Ask in team chat** - Don't stay blocked

---

**Last Updated:** January 2026
**Maintained by:** YourCow Engineering Team

# Claude Code Instructions - YourCow Frontend

**Purpose:** Instructions for AI assistants working on YourCow's Next.js frontend
**Last Updated:** January 2026

---

## 🎯 Core Directive

**ALWAYS read `ARCHITECTURE.md` before starting any task.**

You are building a production-grade, enterprise-level cattle investment platform. Every component, every line of code must meet professional standards for 2026.

---

## 📖 Mandatory Reading Order

Before writing ANY code:

1. **Read** `ARCHITECTURE.md` - Understand project structure
2. **Read** this file (`claude.md`) - Understand AI workflow
3. **Check** existing code in `app/(investor)/` - See examples
4. **Plan** your approach - Don't jump straight to coding

---

## 🏗️ Project Context

**App Name:** YourCow
**User:** Retail investors (non-crypto, non-technical)
**Style:** Modern fintech, calm, serious, trustworthy
**Tech Stack:**
- Next.js 15 (App Router)
- TypeScript (strict mode)
- Tailwind CSS v4
- Framer Motion (animations)
- DaisyUI (base components)
- next/font (optimized fonts)

**Brand:**
- Primary: Deep green (#1B5E20) - nature, trust
- Secondary: Sky blue (#4FC3F7) - liquidity, clarity
- Accent: Warm brown (#8D6E63) - real assets, earth
- Background: Off-white (#FAFAF8) - calm, clean

**Typography:**
- Headlines/Logo: Playfair Display (serif, elegant)
- Body: Inter (sans-serif, modern)

**Design Philosophy:**
- NO crypto language or aesthetics
- NO trading UI patterns
- NO flashy animations or complex charts
- YES calm fintech vibes
- YES agricultural authenticity
- YES accessibility first

---

## 🎨 Using the Frontend Design Plugin

**ALWAYS use the design plugin for UI work.**

### When to Invoke the Plugin

Trigger the plugin for:
- ✅ Creating new screens/pages
- ✅ Building complex UI components
- ✅ Designing user flows
- ✅ Implementing animations
- ✅ Styling forms and inputs

### How to Invoke the Plugin

```
Use the Skill tool with command: "frontend-design:frontend-design"
```

### What to Tell the Plugin

When invoking, provide:

1. **Feature context** - What feature is this for? (investor, admin, operator)
2. **User story** - What is the user trying to do?
3. **Design constraints** - Reference YourCow brand (see above)
4. **Technical requirements** - Tailwind only, accessibility, responsive
5. **Architecture reference** - "Follow ARCHITECTURE.md structure"

**Example invocation:**

```
I need to build the investor portfolio screen (INV-03).

Context:
- Feature: Investor dashboard
- User: Retail investor wants to see their cattle investments
- Style: YourCow brand (deep green primary, sky blue accents, Inter + Playfair fonts)
- Tech: Next.js App Router, Tailwind CSS v4, TypeScript
- Structure: Follow feature-based colocation in app/(investor)/_components/

Requirements:
- Show portfolio value, active investments, recent activity
- Mobile-first responsive design
- Calm, trustworthy fintech aesthetic (NO crypto vibes)
- Framer Motion for subtle animations
- WCAG 2.1 AA accessibility
- Follow ARCHITECTURE.md patterns

Please create the screen components following our atomic design structure.
```

---

## 📋 Step-by-Step Workflow

### For Creating New Screens

**Step 1: Understand the requirement**
- What feature does this belong to? (investor, admin, operator)
- What user problem does it solve?
- What data does it need?

**Step 2: Check ARCHITECTURE.md**
- Where should components go?
- What naming convention to use?
- Are there similar examples?

**Step 3: Plan the structure**
```
app/(feature)/
├── _components/
│   ├── screens/NewScreen.tsx      # Full screen component
│   └── ui/NewComponent.tsx        # If needed
└── new-route/page.tsx             # Route file
```

**Step 4: Invoke design plugin**
- Provide full context (see template above)
- Reference ARCHITECTURE.md
- Specify YourCow brand guidelines

**Step 5: Review generated code**
- Does it follow feature-based colocation?
- Are imports using barrel exports?
- Is it using design tokens (vaca-* colors)?
- Is TypeScript strict?
- Is it accessible?

**Step 6: Build and verify**
```bash
yarn check-types  # TypeScript validation
yarn build        # Production build test
```

---

## 🎨 Design Standards for 2026

### Modern Best Practices

1. **Tailwind CSS v4 ONLY**
   - NO CSS-in-JS (styled-components, emotion)
   - NO inline styles
   - NO traditional CSS modules
   - Use `cn()` utility for class merging

2. **Atomic Design Pattern**
   - Build from primitives (atoms) up
   - Compose larger components from smaller ones
   - Keep components focused and single-purpose

3. **Server Components by Default**
   - Use `"use client"` ONLY when needed:
     - useState, useEffect, event handlers
     - Framer Motion animations
     - Browser-only APIs
   - Keep server components for data fetching

4. **TypeScript Strict Mode**
   - NO `any` types
   - Define interfaces for all props
   - Use generics where appropriate

5. **Accessibility First**
   - Semantic HTML (`<button>` not `<div onClick>`)
   - ARIA labels on interactive elements
   - Keyboard navigation support
   - Focus management
   - Color contrast 4.5:1 minimum

6. **Performance Optimized**
   - next/font for web fonts
   - Image optimization with next/image
   - Code splitting with dynamic imports
   - Minimal client-side JavaScript

---

## 📝 Prompt Templates

### Template 1: New Feature Screen

```
Create [SCREEN_NAME] for the [FEATURE] feature.

Architecture:
- Follow feature-based colocation pattern from ARCHITECTURE.md
- Place in app/([FEATURE])/_components/screens/[ScreenName].tsx
- Create route at app/([FEATURE])/[route-name]/page.tsx

Design:
- YourCow brand: deep green primary, sky blue accents, off-white bg
- Fonts: Playfair Display (headings), Inter (body)
- Style: Calm modern fintech, NO crypto aesthetics
- Mobile-first responsive (sm, md, lg breakpoints)

Technical:
- Next.js 15 App Router
- TypeScript (strict, no any)
- Tailwind CSS v4 (use vaca-* color tokens)
- Framer Motion for animations
- WCAG 2.1 AA accessibility

Requirements:
[LIST SPECIFIC REQUIREMENTS]

Use the frontend-design plugin to create this following ARCHITECTURE.md structure.
```

### Template 2: Shared UI Component

```
Create a shared [COMPONENT_NAME] component for use across all features.

Location: components/ui/[ComponentName].tsx

Requirements:
- Generic, no feature-specific logic
- Accepts variant props for styling
- TypeScript interface for props
- Accessible (ARIA labels, keyboard nav)
- Uses Tailwind CSS v4
- Composable with other components

Design:
- Clean, minimal aesthetic
- Follows YourCow spacing/sizing scale
- Works in light mode (dark mode ready)

Do NOT hardcode feature-specific colors or logic.
Export from components/ui/index.ts.
```

### Template 3: Feature-Specific Component

```
Create [COMPONENT_NAME] for the [FEATURE] feature.

Location: app/([FEATURE])/_components/ui/[ComponentName].tsx

Context:
- Feature: [investor/admin/operator]
- Purpose: [What does this component do?]
- Used by: [Which screens use this?]

Design:
- [FEATURE]-specific branding (e.g., vaca-green for investor)
- Follows atomic design (builds on shared primitives)
- Tailwind CSS v4 with feature tokens

Technical:
- TypeScript interface
- Framer Motion if animated
- Accessibility compliant
- Exports from _components/index.ts

Use the frontend-design plugin with YourCow brand guidelines.
```

### Template 4: Animation/Interaction

```
Add [ANIMATION_TYPE] to [COMPONENT_NAME].

Requirements:
- Use Framer Motion (already in dependencies)
- Subtle, professional animations (NO flashy effects)
- Respect prefers-reduced-motion
- Performance: transform/opacity only
- Easing: [0.4, 0, 0.2, 1] (standard curve)

Examples:
- Page transitions: fade in + slide up
- Button hover: scale(1.02) + shadow
- Form success: checkmark appear animation

Keep animations calm and fintech-appropriate.
```

### Template 5: Form/Input Component

```
Create [FORM_NAME] form for [FEATURE].

Location: app/([FEATURE])/_components/ui/[FormName].tsx

Fields:
[LIST FIELDS WITH TYPES]

Validation:
[LIST VALIDATION RULES]

Design:
- YourCow input styling (rounded-xl, border-2, focus rings)
- Error states with clear messaging
- Loading states during submission
- Success feedback

Technical:
- React Hook Form or native form handling
- TypeScript types for form data
- Accessible labels and error announcements
- Keyboard navigation support

Follow investor login form as reference: app/(investor)/_components/screens/LoginScreen.tsx
```

---

## 🚨 Critical Rules - NEVER BREAK THESE

### 1. File Organization

❌ **NEVER** put investor components in `components/`
```
components/investor/Logo.tsx  ❌ WRONG
```

✅ **ALWAYS** use feature-based colocation
```
app/(investor)/_components/ui/Logo.tsx  ✅ CORRECT
```

### 2. Imports

❌ **NEVER** use deep imports
```tsx
import { Logo } from "../_components/ui/Logo";  ❌
```

✅ **ALWAYS** use barrel exports
```tsx
import { Logo } from "../_components";  ✅
```

### 3. Styling

❌ **NEVER** hardcode colors
```tsx
<div className="bg-[#1B5E20]">  ❌
```

✅ **ALWAYS** use design tokens
```tsx
<div className="bg-vaca-green">  ✅
```

### 4. TypeScript

❌ **NEVER** use `any`
```tsx
function Button(props: any) {}  ❌
```

✅ **ALWAYS** define types
```tsx
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
}
function Button({ children, onClick }: ButtonProps) {}  ✅
```

### 5. Accessibility

❌ **NEVER** skip semantic HTML
```tsx
<div onClick={handleClick}>Click me</div>  ❌
```

✅ **ALWAYS** use proper elements
```tsx
<button onClick={handleClick} aria-label="Submit">
  Click me
</button>  ✅
```

### 6. Route Structure

❌ **NEVER** create routes outside route groups
```
app/welcome/page.tsx  ❌ (if it's investor-specific)
```

✅ **ALWAYS** use route groups
```
app/(investor)/welcome/page.tsx  ✅
```

---

## 🔍 Code Review Checklist

Before considering any code complete, verify:

### Structure
- [ ] Component in correct folder (feature vs shared)?
- [ ] Using route groups for features?
- [ ] Private folders (`_components`) for internal code?
- [ ] Barrel exports created/updated?

### Design
- [ ] Using design tokens (vaca-* colors)?
- [ ] Following YourCow brand guidelines?
- [ ] Tailwind CSS v4 ONLY (no inline styles)?
- [ ] Mobile-first responsive?
- [ ] Calm fintech aesthetic (NO crypto vibes)?

### Code Quality
- [ ] TypeScript strict (no `any`)?
- [ ] Props interfaces defined?
- [ ] Imports clean (barrel exports)?
- [ ] No hardcoded values?

### Accessibility
- [ ] Semantic HTML?
- [ ] ARIA labels where needed?
- [ ] Focus states visible?
- [ ] Keyboard navigation works?
- [ ] Color contrast 4.5:1+?

### Performance
- [ ] Server components where possible?
- [ ] `"use client"` only when needed?
- [ ] Images optimized (next/image)?
- [ ] Fonts optimized (next/font)?

### Testing
- [ ] TypeScript compiles (`yarn check-types`)?
- [ ] Build succeeds (`yarn build`)?
- [ ] Component renders correctly?
- [ ] Responsive on mobile/tablet/desktop?

---

## 🎭 Animation Guidelines

### Standard Animations

**Page Mount:**
```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  },
};
```

**Button Hover:**
```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.2 }}
>
```

**Loading State:**
```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
>
```

### Animation Don'ts

❌ NO bouncing effects
❌ NO spinning effects (except loading)
❌ NO shake/wiggle animations
❌ NO complex spring animations
❌ NO delays > 1 second

---

## 🗂️ Folder Decision Tree

**"Where does this file go?"** - Use this decision tree:

```
START
  ↓
Is it a route (URL)?
  ├─ YES → app/([feature])/[route-name]/page.tsx
  └─ NO → Continue
       ↓
Is it used by MULTIPLE features?
  ├─ YES → components/ui/[ComponentName].tsx
  └─ NO → Continue
       ↓
Is it feature-specific UI?
  ├─ YES → app/([feature])/_components/ui/[ComponentName].tsx
  └─ NO → Continue
       ↓
Is it a full screen?
  ├─ YES → app/([feature])/_components/screens/[ScreenName].tsx
  └─ NO → Continue
       ↓
Is it a layout wrapper?
  ├─ YES → app/([feature])/_components/layouts/[LayoutName].tsx
  └─ NO → Continue
       ↓
Is it a utility function?
  ├─ YES → lib/utils/[utilityName].ts
  └─ NO → Continue
       ↓
Is it a design token/constant?
  ├─ YES → lib/constants/[constantName].ts
  └─ NO → Continue
       ↓
Is it business logic/API?
  ├─ YES → services/[serviceName].ts
  └─ NO → Continue
       ↓
Is it a shared hook?
  ├─ YES → hooks/[useSomething].ts
  └─ NO → Continue
       ↓
Is it a TypeScript type?
  ├─ YES (shared) → types/[typeName].ts
  └─ YES (feature) → app/([feature])/_types/[typeName].ts
```

---

## 📚 Reference Examples

### Perfect Example: Investor Welcome Screen

**Location:** `app/(investor)/_components/screens/WelcomeScreen.tsx`

**Why it's perfect:**
- ✅ Feature-based colocation
- ✅ Uses design tokens (vaca-*)
- ✅ Framer Motion for animations
- ✅ TypeScript strict
- ✅ Accessible (semantic HTML, ARIA)
- ✅ Mobile-first responsive
- ✅ Calm fintech aesthetic
- ✅ Imports from barrel exports

**Study this file before building new screens.**

### Reference Files to Study

1. **Screen component:** `app/(investor)/_components/screens/WelcomeScreen.tsx`
2. **Layout component:** `app/(investor)/_components/layouts/InvestorLayout.tsx`
3. **UI component:** `app/(investor)/_components/ui/Logo.tsx`
4. **Route file:** `app/(investor)/welcome/page.tsx`
5. **Design tokens:** `lib/constants/brand.ts`
6. **Utility:** `lib/utils/cn.ts`

---

## 🆘 Troubleshooting

### Issue: "Where should this component go?"

**Answer:** Use the Folder Decision Tree above.

### Issue: "Should this be shared or feature-specific?"

**Ask:**
- Will admin/operator features need this exact component?
  - YES → Shared (`components/ui/`)
  - NO → Feature-specific (`app/([feature])/_components/`)

### Issue: "How do I know if it's working correctly?"

**Run:**
```bash
yarn check-types  # TypeScript validation
yarn build        # Production build
yarn dev          # View in browser
```

### Issue: "The build is failing"

**Check:**
1. All imports correct?
2. TypeScript types defined?
3. No `any` types?
4. All files exported from `index.ts`?

### Issue: "Confused about route groups"

**Remember:**
- `(investor)` folder = organization only
- URL is NOT `/investor/welcome`
- URL IS `/welcome`
- Route groups don't appear in URLs

---

## 🎯 Common Tasks - Quick Reference

### Add New Investor Screen

```bash
# 1. Create screen component
touch app/\(investor\)/_components/screens/NewScreen.tsx

# 2. Create route
mkdir app/\(investor\)/new-route
touch app/\(investor\)/new-route/page.tsx

# 3. Export from barrel
# Edit app/(investor)/_components/index.ts

# 4. Use design plugin for implementation
```

**Prompt:**
```
Create [NewScreen] for investor feature following ARCHITECTURE.md.
Location: app/(investor)/_components/screens/NewScreen.tsx
Route: app/(investor)/new-route/page.tsx
Style: YourCow brand (deep green, Playfair + Inter)
Use frontend-design plugin.
```

### Add Shared Component

```bash
# 1. Create component
touch components/ui/NewComponent.tsx

# 2. Export from barrel
# Edit components/ui/index.ts
```

**Prompt:**
```
Create generic [Component] for use across all features.
Location: components/ui/[Component].tsx
NO feature-specific logic or styling.
Accepts variant props. TypeScript strict.
```

### Update Design Tokens

```typescript
// lib/constants/brand.ts
export const BRAND_COLORS = {
  // Add new color
  purple: { DEFAULT: '#8B5CF6' },
};
```

```typescript
// tailwind.config.ts
colors: {
  vaca: {
    purple: '#8B5CF6',  // Add to Tailwind
  },
}
```

### Add Animation

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }}
>
```

---

## 🎓 Learning Resources

**Before asking questions, check:**

1. **ARCHITECTURE.md** - Project structure, conventions
2. **Existing code** - See `app/(investor)/` for examples
3. **Next.js docs** - https://nextjs.org/docs/app
4. **Tailwind docs** - https://tailwindcss.com/docs
5. **Framer Motion docs** - https://www.framer.com/motion/

---

## ✅ Final Checklist

Before marking any task complete:

- [ ] Read ARCHITECTURE.md ✓
- [ ] Followed folder structure ✓
- [ ] Used design plugin for UI ✓
- [ ] Design tokens (no hardcoded values) ✓
- [ ] TypeScript strict (no any) ✓
- [ ] Accessibility compliant ✓
- [ ] Mobile-first responsive ✓
- [ ] Build succeeds ✓
- [ ] Matches YourCow brand ✓
- [ ] Code reviewed against checklist ✓

---

## 📞 Getting Help

If stuck after reading this doc and ARCHITECTURE.md:

1. **Check existing code** - See similar examples
2. **Review reference files** - Study WelcomeScreen.tsx
3. **Re-read relevant sections** - Architecture, prompts, rules
4. **Ask specific questions** - Not "how do I build a screen?" but "where should I place a feature-specific hook?"

---

**Remember:** Quality over speed. Take time to understand the architecture before coding.

---

**Last Updated:** January 2026
**For:** Claude Code AI Assistant
**Project:** YourCow - Cattle Investment Platform

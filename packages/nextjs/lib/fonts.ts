import { Inter, Playfair_Display } from "next/font/google";

/**
 * Inter - Body text (clean, modern fintech standard)
 * Optimized with next/font for performance
 */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/**
 * Playfair Display - Headlines & logo (elegant, trustworthy serif)
 * Adds gravitas and sophistication
 */
export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["600", "700"],
});

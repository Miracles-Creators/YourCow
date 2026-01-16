/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      // Box shadows
      boxShadow: {
        center: "0 0 12px -2px rgb(0 0 0 / 0.05)",
      },

      // Animations
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        float: "float 20s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -30px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
        },
      },

      // YourCow Brand Colors
      colors: {
        vaca: {
          // Primary - Deep Green (trust, nature, agriculture)
          green: {
            DEFAULT: "#1B5E20",
            dark: "#0D4715",
            light: "#2E7D32",
            lighter: "#4CAF50",
          },
          // Secondary - Sky Blue (liquidity, clarity)
          blue: {
            DEFAULT: "#4FC3F7",
            light: "#81D4FA",
            dark: "#0288D1",
          },
          // Accent - Warm Brown (real assets, earth)
          brown: {
            DEFAULT: "#8D6E63",
            light: "#A1887F",
            dark: "#5D4037",
          },
          // Neutrals
          neutral: {
            bg: "#FAFAF8",
            white: "#FFFFFF",
            gray: {
              50: "#F5F5F4",
              100: "#E7E5E4",
              200: "#D6D3D1",
              300: "#A8A29E",
              400: "#78716C",
              500: "#57534E",
              600: "#44403C",
              700: "#292524",
              800: "#1C1917",
              900: "#0C0A09",
            },
          },
        },
        // Scaffold/DaisyUI semantic colors (for debug/blockexplorer screens)
        scaffold: {
          purple: "#8B45FD",
          cyan: "#42D2F1",
          pink: "#B248DD",
        },
      },

      // Typography
      fontFamily: {
        inter: ["var(--font-inter)", "sans-serif"],
        playfair: ["var(--font-playfair)", "serif"],
      },
    },
  },
};

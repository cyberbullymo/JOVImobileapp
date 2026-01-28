import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Jupiter brand colors
        primary: {
          DEFAULT: "#4A1E6B",
          foreground: "#FFFFFF",
          50: "#F3E8FA",
          100: "#E7D1F5",
          200: "#CF9FEB",
          300: "#B76DE1",
          400: "#9F3BD7",
          500: "#4A1E6B",
          600: "#3D1859",
          700: "#301247",
          800: "#230C35",
          900: "#160623",
        },
        secondary: {
          DEFAULT: "#FF6B6B",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#FFD700",
          foreground: "#1A1A1A",
        },
        background: "#FAFAFA",
        foreground: "#1A1A1A",
        muted: {
          DEFAULT: "#F4F4F5",
          foreground: "#71717A",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1A1A1A",
        },
        border: "#E4E4E7",
        input: "#E4E4E7",
        ring: "#4A1E6B",
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#22C55E",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#1A1A1A",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.25rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

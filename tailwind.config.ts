import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Brand palette as Tailwind utilities */
        brand: {
          50:  "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#1F6FEB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        success: {
          50:  "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          700: "#047857",
        },
        warning: {
          50:  "#FFFBEB",
          100: "#FEF3C7",
          500: "#F59E0B",
          700: "#B45309",
        },
        error: {
          50:  "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          700: "#B91C1C",
        },
      },
      borderRadius: {
        sm:   "6px",
        md:   "8px",
        lg:   "12px",
        xl:   "16px",
        "2xl": "20px",
        full:  "9999px",
        /* Keep shadcn's relative tokens as aliases */
        DEFAULT: "var(--radius)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        xs:      "0 1px 2px rgba(0, 0, 0, 0.04)",
        sm:      "0 2px 8px rgba(0, 0, 0, 0.06)",
        md:      "0 4px 16px rgba(0, 0, 0, 0.08)",
        lg:      "0 8px 32px rgba(0, 0, 0, 0.10)",
        xl:      "0 12px 48px rgba(0, 0, 0, 0.12)",
        primary: "0 4px 16px rgba(31, 111, 235, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;

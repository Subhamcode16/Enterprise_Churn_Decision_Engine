/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#F6F4EE",
        card: "#FFFFFF",
        cardBorder: "#E8E5DD",
        sidebar: "#141312",
        bento: {
          canary: "#FFF7D1",
          canaryBorder: "#FFE885",
          canaryText: "#7A5800",
          rose: "#FFE9E9",
          roseBorder: "#FFC2C2",
          roseText: "#8E2424",
          sage: "#EAF5E8",
          sageBorder: "#C1E7BC",
          sageText: "#235E23",
          lavender: "#EDF0FF",
          lavenderBorder: "#CCD4FF",
          lavenderText: "#2C3D8F",
        },
        gold: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309"
        },
        stone: {
          50: "#FAFAF9",
          100: "#F5F5F4",
          200: "#E7E5E4",
          300: "#D6D3D1",
          400: "#A8A29E",
          500: "#78716C",
          600: "#57534E",
          700: "#44403C",
          800: "#292524",
          900: "#1C1917",
          950: "#0E0D0C"
        },
        risk: {
          low: "#10B981",
          medium: "#F59E0B",
          high: "#F97316",
          critical: "#EF4444"
        }
      },
      boxShadow: {
        bento: "0 2px 12px -2px rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)",
        bentoHover: "0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 2px 6px 0 rgba(0, 0, 0, 0.04)",
        glowGold: "0 0 25px -4px rgba(245, 158, 11, 0.3)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Newsreader", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}

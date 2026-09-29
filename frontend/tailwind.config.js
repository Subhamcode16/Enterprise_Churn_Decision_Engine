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
        background: "#0E0D0C",
        surface: {
          50: "#2B2926",
          100: "#22201E",
          200: "#1A1918",
          300: "#141312",
          border: "rgba(255, 255, 255, 0.08)",
          specular: "rgba(245, 158, 11, 0.25)"
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
          900: "#1C1917"
        },
        risk: {
          low: "#10B981",
          medium: "#F59E0B",
          high: "#F97316",
          critical: "#EF4444"
        }
      },
      boxShadow: {
        glowGold: "0 0 30px -5px rgba(245, 158, 11, 0.2)",
        glowRisk: "0 0 30px -5px rgba(239, 68, 68, 0.2)",
        card: "0 10px 40px 0 rgba(0, 0, 0, 0.6)"
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}

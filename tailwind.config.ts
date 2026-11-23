import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FCFBF7",
          100: "#F9F6F0",
          200: "#F3ECE1",
          300: "#EBE0CF",
          400: "#DFCDB5",
          500: "#D3B997",
        },
        coffee: {
          50: "#F7F3F0",
          100: "#EDE4DE",
          200: "#D9C6BB",
          300: "#C4A797",
          400: "#9A715A",
          500: "#6F4E37",
          600: "#5A3D29",
          700: "#452C1C",
          800: "#321E12",
          900: "#22130B",
          950: "#140A06",
        },
        gold: {
          50: "#FDFBF2",
          100: "#FBF6E2",
          200: "#F6EAC2",
          300: "#F0DC9C",
          400: "#E5C86C",
          500: "#D4AF37",
          600: "#B89425",
          700: "#91731B",
          800: "#6D5515",
          900: "#4D3B10",
        },
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(212, 175, 55, 0.7)" },
          "70%": { transform: "scale(1)", boxShadow: "0 0 0 16px rgba(212, 175, 55, 0)" },
          "100%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(212, 175, 55, 0)" },
        },
        alarmRing: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "rotate(-10deg)" },
          "20%, 40%, 60%, 80%": { transform: "rotate(10deg)" },
        }
      },
      animation: {
        "pulse-ring": "pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "alarm-ring": "alarmRing 0.8s ease-in-out infinite",
      }
    },
  },
  plugins: [],
};
export default config;

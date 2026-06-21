import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Dynamic bubble colors
    "bg-green-600",
    "border-green-600",
    "hover:border-green-500",
    "border-green-700",
    "bg-red-600",
    "border-red-600",
    "hover:border-red-500",
    "border-red-700",
    "bg-amber-600",
    "border-amber-600",
    "hover:border-amber-500",
    "border-amber-700",
    "bg-blue-600",
    "border-blue-600",
    "hover:border-blue-500",
    "border-blue-700",
    "bg-gray-600",
    "border-gray-600",
    "hover:border-gray-500",
    "border-gray-700",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "fade-out": "fadeOut 0.3s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

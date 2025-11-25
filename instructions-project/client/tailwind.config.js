import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        // Align with HeroUI defaults for a clean light mode
        light: {
          colors: {
            background: "#ffffff",
            foreground: "#111827",
          },
        },
        dark: {
          colors: {
            background: "#000000",
            foreground: "#ffffff",
          },
        },
      },
    })
  ],
  theme: {
    screens: {
      tablet: "1366px",
    },
    extend: {
      fontFamily: {
        sans: ["Outfit", "Urbanist", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "Noto Sans", "sans-serif"],
      },
      colors: {
        'brand-violet': '#A19AFE',
        'brand-peach': '#F9D7AO',
        'brand-black': '#242424',
        'brand-gray': '#4B5563',
      },
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(135deg, #A19AFE 0%, #F9D7AO 100%)',
        'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 100%)',
      },
      keyframes: {
        shine: {
          '0%': { 'background-position': '100%' },
          '100%': { 'background-position': '-100%' },
        },
      },
      animation: {
        shine: 'shine 5s linear infinite',
      },
    },
  },
};
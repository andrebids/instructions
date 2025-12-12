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
      addCommonColors: true,
      themes: {
        light: {
          colors: {
            background: "#ffffff",
            foreground: "#111827",
            primary: {
              50: "#e7f0ff",
              100: "#c7d8ff",
              200: "#a3c1ff",
              300: "#7faaff",
              400: "#5b92ff",
              500: "#2b7fff",
              600: "#1f64cc",
              700: "#164c99",
              800: "#0d3366",
              900: "#061933",
              DEFAULT: "#2b7fff",
              foreground: "#ffffff",
            },
          },
        },
        dark: {
          extend: "dark",
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
        primary: {
          50: "#e7f0ff",
          100: "#c7d8ff",
          200: "#a3c1ff",
          300: "#7faaff",
          400: "#5b92ff",
          500: "#2b7fff",
          600: "#1f64cc",
          700: "#164c99",
          800: "#0d3366",
          900: "#061933",
          DEFAULT: "#2b7fff",
          foreground: "#ffffff",
        },
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
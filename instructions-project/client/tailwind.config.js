import {heroui} from "@heroui/react";

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
    extend: {
      fontFamily: {
        sans: ["Urbanist", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "Noto Sans", "sans-serif"],
      },
    },
  },
};
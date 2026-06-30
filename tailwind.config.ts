import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f3ff",
          100: "#ebe9fe",
          200: "#d9d6fe",
          300: "#bdb4fe",
          400: "#9b8afb",
          500: "#7c5cf6",
          600: "#6c3ded",
          700: "#5d2bd8",
          800: "#4d24b3",
          900: "#412091",
        },
      },
    },
  },
  plugins: [],
};

export default config;

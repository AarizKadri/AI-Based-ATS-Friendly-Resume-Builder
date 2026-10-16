import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#16213E",
          50: "#EEF0F6",
          100: "#D6DAE8",
          300: "#8A93B4",
          500: "#3F4E63",
          700: "#232B45",
          900: "#16213E",
        },
        paper: "#F7F5F0",
        signal: {
          DEFAULT: "#0E7C7B",
          50: "#E4F3F2",
          100: "#C3E6E4",
          500: "#0E7C7B",
          700: "#0A5958",
        },
        gold: "#C9A227",
        danger: "#B3432B",
      },
      fontFamily: {
        display: ["Source Serif 4", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};

export default config;

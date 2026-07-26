import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        muted: "#667085",
        court: "#EA580C",
        trust: "#0F766E",
        line: "#EAECF0"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

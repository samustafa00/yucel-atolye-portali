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
        ink: "#18202f",
        skyglass: "#e8f5ff",
        leaf: "#2f9e6d",
        amber: "#f4b942",
        coral: "#ef6f6c"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(32, 50, 84, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;

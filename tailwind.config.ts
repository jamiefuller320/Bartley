import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sea: {
          DEFAULT: "#0b4f6c",
          deep: "#073a50",
        },
        foam: "#e8f3f7",
        pin: "#b0892d",
        // Keep forest aliases so any residual Tailwind classes still resolve.
        forest: {
          DEFAULT: "#073a50",
          mid: "#0b4f6c",
          soft: "#5a6b7d",
        },
        mist: "#e8f3f7",
        gold: "#b0892d",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Figtree", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

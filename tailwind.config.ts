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
        surface: {
          DEFAULT: "#0c0c0e",
          elevated: "#141418",
          hover: "#1a1a20",
        },
        line: {
          DEFAULT: "#2a2a32",
          subtle: "#1e1e24",
        },
        ink: {
          DEFAULT: "#f2f2f4",
          muted: "#8b8b96",
          dim: "#5c5c68",
        },
        critical: {
          DEFAULT: "#fb7185",
          dim: "rgba(251, 113, 133, 0.12)",
          border: "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;

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
          DEFAULT: "#050505",
          elevated: "#111111",
          hover: "#1a1a1a",
        },
        line: {
          DEFAULT: "#2a2a2a",
          subtle: "#1c1c1c",
        },
        ink: {
          DEFAULT: "#f5f5f5",
          muted: "#9a9a9a",
          dim: "#6b6b6b",
        },
        accent: {
          DEFAULT: "#8fa8b8",
          dim: "rgba(143, 168, 184, 0.14)",
          strong: "#a8c0ce",
        },
        critical: {
          DEFAULT: "#8fa8b8",
          dim: "rgba(143, 168, 184, 0.14)",
          border: "#a8c0ce",
        },
        task: {
          DEFAULT: "#f4f4f5",
          text: "#111111",
          muted: "#5c5c5c",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        display: ["var(--font-display)", "var(--font-geist-sans)", "serif"],
      },
      borderRadius: {
        task: "10px",
      },
    },
  },
  plugins: [],
};
export default config;

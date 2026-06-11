import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        // CMA dark theme palette
        canvas: "#0d1117",
        surface: "#161b22",
        border: "#30363d",
        muted: "#8b949e",
        subtle: "#484f58",
        // Accent colors
        blue: { DEFAULT: "#388bfd", light: "#58a6ff" },
        green: { DEFAULT: "#3fb950" },
        amber: { DEFAULT: "#f0b429" },
        red: { DEFAULT: "#f85149" },
        danger: "#da3633",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

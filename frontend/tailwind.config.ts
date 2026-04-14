import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07111f",
        panel: "#0f1b2d",
        line: "#1d304b",
        accent: "#7dd3fc",
        accentSoft: "#bae6fd",
        success: "#7dd3fc",
        warning: "#60a5fa",
        rose: "#38bdf8"
      },
      boxShadow: {
        glow: "0 24px 80px rgba(8, 145, 178, 0.22)"
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "system-ui", "sans-serif"],
        brand: ["'Iowan Old Style'", "'Palatino Linotype'", "'Book Antiqua'", "Georgia", "serif"]
      }
    }
  },
  plugins: []
} satisfies Config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.tsx",
    "./app/**/*.ts",
    "./components/**/*.tsx",
    "./components/**/*.ts",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-inspired colors (DESIGN-apple.md)
        primary: {
          DEFAULT: "#0066cc",
          focus: "#0071e3",
          dark: "#2997ff",
        },
        ink: {
          DEFAULT: "#1d1d1f",
          muted: "#7a7a7a",
          dark: "#333333",
        },
        canvas: {
          DEFAULT: "#ffffff",
          parchment: "#f5f5f7",
          pearl: "#fafafc",
        },
        tile: {
          1: "#272729",
          2: "#2a2a2c",
          3: "#252527",
          black: "#000000",
        },
        success: {
          DEFAULT: "#24a148",
          light: "#ecfdf3",
        },
        warning: {
          DEFAULT: "#ff9f0a",
          light: "#fff9eb",
        },
        danger: {
          DEFAULT: "#ff453a",
          light: "#fef2f2",
        },
        info: {
          DEFAULT: "#0a84ff",
          light: "#eff6ff",
        },
      },
      borderRadius: {
        xs: "5px",
        sm: "8px",
        md: "11px",
        lg: "18px",
        pill: "9999px",
      },
      boxShadow: {
        product: "3px 5px 30px rgba(0, 0, 0, 0.22)",
        overlay: "0 10px 30px rgba(0, 0, 0, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-sf-text)", "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-sf-display)", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

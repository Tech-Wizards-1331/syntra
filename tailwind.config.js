/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./frontend/templates/**/*.html",
  ],
  theme: {
    extend: {
      colors: {
        shell:   "#020617",
        panel:   "#0b1220",
        panelHi: "#111b2e",
        line:    "#1f2b45",
        textSoft:"#91a3c2",
        focus:   "#2dd4bf",
        glow:    "#eab308",
      },
      boxShadow: {
        glass: "0 20px 50px rgba(2, 6, 23, 0.55)",
        neon:  "0 0 0 1px rgba(45,212,191,0.35), 0 0 30px rgba(45,212,191,0.15), 0 0 70px rgba(234,179,8,0.12)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        tech: ["Orbitron", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

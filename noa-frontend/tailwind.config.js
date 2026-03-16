/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        noa: {
          bg: "#07111f",
          panel: "#0d1728",
          panel2: "#132038",
          line: "#223352",
          text: "#ebf2ff",
          muted: "#93a4c3",
          accent: "#2dd4bf",
          blue: "#60a5fa",
          violet: "#8b5cf6",
          success: "#22c55e",
          warning: "#f59e0b",
          danger: "#ef4444"
        }
      },
      boxShadow: {
        panel: "0 10px 30px rgba(0,0,0,0.25)",
        glow: "0 0 0 1px rgba(255,255,255,0.03), 0 16px 40px rgba(0,0,0,0.28)"
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)"
      }
    },
  },
  plugins: [],
};

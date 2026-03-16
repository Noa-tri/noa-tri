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
          bg: "#0b1020",
          panel: "#121933",
          soft: "#1b2447",
          line: "#2d3b72",
          text: "#e8ecff",
          muted: "#9aa6d1",
          accent: "#5eead4",
          accent2: "#60a5fa",
          danger: "#f87171",
          warning: "#fbbf24",
          success: "#34d399"
        }
      }
    }
  },
  plugins: []
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#102033",
        muted: "#667085",
        panel: "#ffffff",
        safe: "#0c9f62",
        caution: "#c27803",
        danger: "#d92d20",
        skyline: "#1677c8",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(16, 32, 51, 0.10)",
        alert: "0 18px 48px rgba(217, 45, 32, 0.20)",
      },
    },
  },
  plugins: [],
};

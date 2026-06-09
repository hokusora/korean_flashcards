/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          pink: '#ffd1dc',
          purple: '#e6e6fa',
          blue: '#b8c6db',
        }
      }
    },
  },
  plugins: [],
}
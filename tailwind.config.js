/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/layouts/*.html",
    "./src/partials/*.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: 'oklch(59.2% 0.249 0.584)',
      },
      fontFamily: {
        sans: ['Raleway', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
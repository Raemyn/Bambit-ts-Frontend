/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      maxWidth: { '600': '600px' },
      maxHeight: { '600': '600px' },
    },
  },
  plugins: [],
}

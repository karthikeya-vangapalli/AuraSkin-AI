/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        skin: {
          50: '#FAF5F0',
          100: '#F5EBE1',
          200: '#EAD7C5',
          500: '#C89B7B',
          600: '#B07D5B',
          800: '#673D26',
          900: '#3D2214',
        },
        glow: {
          teal: '#14B8A6',
          rose: '#F43F5E',
          purple: '#A855F7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

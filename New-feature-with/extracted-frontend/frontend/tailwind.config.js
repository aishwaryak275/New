/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        subscriber: {
          light: '#f0f9ff',
          main: '#0ea5e9',
          dark: '#0369a1'
        },
        agent: {
          light: '#f0f9ff',
          main: '#0ea5e9',
          dark: '#0369a1'
        },
        billing: {
          light: '#f0f9ff',
          main: '#0ea5e9',
          dark: '#0369a1'
        },
        netops: {
          light: '#f0f9ff',
          main: '#0ea5e9',
          dark: '#0369a1'
        },
        compliance: {
          light: '#f0f9ff',
          main: '#0ea5e9',
          dark: '#0369a1'
        },
        admin: {
          light: '#f0f9ff',
          main: '#0ea5e9',
          dark: '#0369a1'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

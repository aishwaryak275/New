/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f6ff',
          100: '#ebedff',
          200: '#dadcff',
          300: '#c0c3ff',
          400: '#9fa1ff',
          500: '#7574ff',
          600: '#534eff',
          700: '#3B4FE0', // Deep Indigo primary
          800: '#313eb6',
          900: '#2c3690',
          950: '#1b1d54',
        },
        subscriber: {
          light: '#eef2ff',
          main: '#3B4FE0',
          dark: '#312e81'
        },
        agent: {
          light: '#f0fdfa',
          main: '#0d9488',
          dark: '#115e59'
        },
        billing: {
          light: '#ecfdf5',
          main: '#059669',
          dark: '#065f46'
        },
        netops: {
          light: '#f5f3ff',
          main: '#7c3aed',
          dark: '#5b21b6'
        },
        compliance: {
          light: '#fffbeb',
          main: '#d97706',
          dark: '#92400e'
        },
        admin: {
          light: '#fff5f5',
          main: '#e11d48',
          dark: '#9f1239'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

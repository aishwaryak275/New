/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand primary — #2563EB (blue-600) with #EFF6FF (blue-50) as the light tint
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        subscriber: {
          light: '#eff6ff',
          main: '#2563eb',
          dark: '#1d4ed8'
        },
        agent: {
          light: '#eff6ff',
          main: '#2563eb',
          dark: '#1d4ed8'
        },
        billing: {
          light: '#eff6ff',
          main: '#2563eb',
          dark: '#1d4ed8'
        },
        netops: {
          light: '#eff6ff',
          main: '#2563eb',
          dark: '#1d4ed8'
        },
        compliance: {
          light: '#eff6ff',
          main: '#2563eb',
          dark: '#1d4ed8'
        },
        admin: {
          light: '#eff6ff',
          main: '#2563eb',
          dark: '#1d4ed8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

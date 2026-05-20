/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#e6eeff',
          200: '#bfdaff',
          300: '#99c6ff',
          400: '#66a8ff',
          500: '#337fff',
          600: '#2c6fe6',
          700: '#2458b3',
          800: '#1b3f80',
          900: '#11264d'
        },
        accent: {
          DEFAULT: '#7c3aed'
        }
      },
      boxShadow: {
        'soft-lg': '0 10px 30px rgba(16,24,40,0.08)',
        'card': '0 6px 18px rgba(15,23,42,0.06)'
      },
      ringColor: {
        brand: '#337fff'
      }
    }
  },
  plugins: []
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          light: '#f0f4f8',     // Pale blue-grey
          navy: '#0f172a',      // Deep navy
          teal: '#0d9488',      // Muted teal
          charcoal: '#334155',  // Charcoal text
          primary: 'var(--brand-primary)',
          'primary-hover': 'var(--brand-primary-hover)',
          'primary-light': 'var(--brand-primary-light)',
          'primary-text': 'var(--brand-primary-text)',
        }
      },
      borderRadius: {
        'card': '12px',
      }
    },
  },
  plugins: [],
}

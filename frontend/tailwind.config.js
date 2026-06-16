/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0F172A',     // Slate 900
        secondary: '#1E293B',   // Slate 800
        accent: '#F59E0B',      // Amber 500
        success: '#22C55E',     // Green 500
        danger: '#EF4444',      // Red 500
        background: '#F8FAFC',  // Slate 50
        
        // Dark Mode Alternatives
        dark: {
          bg: '#0F172A',
          card: '#1E293B',
          border: '#334155',
          text: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

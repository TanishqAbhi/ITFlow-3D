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
        cyber: {
          bg: '#030712',
          card: '#0b0f19',
          border: '#1f293d',
          accent: '#6366f1',
          cyan: '#06b6d4',
          neon: '#10b981',
          rose: '#f43f5e'
        },
        admin: {
          bg: '#0a0d14',
          sidebar: '#07090e',
          card: '#111622',
          border: '#1e2638',
          accent: '#38bdf8'
        },
        staff: {
          bg: '#0b0f17',
          sidebar: '#080c12',
          card: '#131b28',
          border: '#212e42',
          accent: '#10b981'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.45)',
        'glow-purple': '0 0 25px -4px rgba(168, 85, 247, 0.45)',
        'glow-neon': '0 0 20px -3px rgba(16, 185, 129, 0.45)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}

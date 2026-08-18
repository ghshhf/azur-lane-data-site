/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'al-bg': '#0f1923',
        'al-panel': '#1a2332',
        'al-panel-light': '#243044',
        'al-gold': '#d4a843',
        'al-gold-dark': '#b8922e',
        'al-text': '#ffffff',
        'al-text-muted': '#b0b8c4',
        'al-text-dim': '#6b7280',
        'al-border': '#2a3a50',
        'r-n': '#8a8a8a', 'r-r': '#4a9eff', 'r-sr': '#c77dff',
        'r-ssr': '#ffd700', 'r-elite': '#ff8c00', 'r-meta': '#ff4444',
        't-dd': '#00bcd4', 't-cl': '#4caf50', 't-ca': '#ff9800',
        't-bb': '#f44336', 't-cv': '#9c27b0', 't-cvl': '#e91e63',
        't-ss': '#2196f3', 't-bbv': '#6a1b9a',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

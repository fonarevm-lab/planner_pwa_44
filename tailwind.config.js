export default {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#0f1115', card: '#1a1d24', elev: '#22262f' },
        fg: { DEFAULT: '#e5e7eb', muted: '#9ca3af' },
        accent: { DEFAULT: '#7c3aed', hover: '#6d28d9' },
      },
      maxWidth: { app: '768px' },
    },
  },
  plugins: [],
}

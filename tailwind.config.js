/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        brand: { DEFAULT: 'rgb(var(--c-brand) / <alpha-value>)', dark: 'rgb(var(--c-brand-dark) / <alpha-value>)', tint: 'rgb(var(--c-brand-tint) / <alpha-value>)' },
        lav: 'rgb(var(--c-lav) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        star: 'rgb(var(--c-star) / <alpha-value>)',
        signal: 'rgb(var(--c-signal) / <alpha-value>)',
        danger: { DEFAULT: 'rgb(var(--c-danger) / <alpha-value>)', tint: 'rgb(var(--c-danger-tint) / <alpha-value>)' },
        ok: { DEFAULT: 'rgb(var(--c-ok) / <alpha-value>)', tint: 'rgb(var(--c-ok-tint) / <alpha-value>)' },
      },
      fontFamily: {
        sans: ['"Noto Sans Georgian"', 'system-ui', 'sans-serif'],
        display: ['"Noto Serif Georgian"', 'Georgia', 'serif'],
      },
      borderRadius: { md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
      boxShadow: { card: 'var(--shadow-sm)' },
    },
  },
  plugins: [],
}

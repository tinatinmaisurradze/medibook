/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        brand: { DEFAULT: 'var(--color-brand)', dark: 'var(--color-brand-dark)', tint: 'var(--color-brand-tint)' },
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        line: 'var(--color-line)',
        gold: 'var(--color-gold)',
        danger: { DEFAULT: 'var(--color-danger)', tint: 'var(--color-danger-tint)' },
        ok: { DEFAULT: 'var(--color-ok)', tint: 'var(--color-ok-tint)' },
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

import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mist: '#F4F7FD',
        paper: '#FFFFFF',
        ink: { DEFAULT: '#111C33', soft: '#3A4763', muted: '#5E6B85', faint: '#94A0B7' },
        line: { DEFAULT: '#DAE2EE', soft: '#E8EDF6' },
        brand: { 50: '#EFF5FF', 100: '#DBE8FE', 200: '#B6D0FC', 400: '#4F8EF7', 500: '#2F6FED', 600: '#1F5AD6', 700: '#1947AD', 800: '#143A8C', 900: '#0E2A66' },
        star: { DEFAULT: '#EFA00B', soft: '#FDF1D6' },
        leaf: { DEFAULT: '#1D8257', soft: '#E1F2E9' },
        rose: { DEFAULT: '#C2364C', soft: '#FBE5E8' },
        amber: { DEFAULT: '#B7791F', soft: '#FBF0DC' },
        violet: { DEFAULT: '#6D4CF0', soft: '#EEEAFE' },
        // Diverging pair for praise vs criticism (validated for colour-vision deficiency)
        praise: { DEFAULT: '#1E86A8', soft: '#DDEFF5' },
        critique: { DEFAULT: '#D3553A', soft: '#FBE6E0' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', '"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans Variable"', '"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem', xl3: '1.75rem' },
      boxShadow: {
        lift: '0 1px 0 rgba(31,90,214,0.05), 0 12px 32px -18px rgba(20,58,140,0.28)',
        pop: '0 24px 60px -24px rgba(14,42,102,0.4)',
      },
      keyframes: {
        sheen: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
        rise: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: { sheen: 'sheen 6s linear infinite', rise: 'rise .35s ease-out both' },
    },
  },
  plugins: [],
} satisfies Config;

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'ui-serif', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'sans-serif']
      },
      colors: {
        paper: 'hsl(var(--paper))',
        ink: 'hsl(var(--ink))',
        pin: 'hsl(var(--pin))',
        teal: {
          DEFAULT: 'hsl(var(--teal))',
          foreground: 'hsl(var(--teal-foreground))'
        },
        coral: {
          DEFAULT: 'hsl(var(--coral))',
          foreground: 'hsl(var(--coral-foreground))'
        },
        card: 'hsl(var(--card))',
        border: 'hsl(var(--border))',
        muted: 'hsl(var(--muted))'
      },
      borderRadius: {
        card: '14px'
      },
      boxShadow: {
        pin: '0 1px 2px rgba(38, 40, 43, 0.06), 0 4px 10px rgba(38, 40, 43, 0.06)'
      }
    }
  },
  plugins: []
};

export default config;

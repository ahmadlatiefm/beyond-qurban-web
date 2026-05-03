import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:  ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand tokens — sesuai mockup HTML
        'brand-dark':          '#0D3320',
        'brand-surface':       '#1B5E3B',
        'brand-surface-light': '#3D7A56',
        'brand-accent':        '#C8962A',
        'brand-accent-light':  '#F5E6C3',
        'brand-light':         '#FAFAF8',
        'brand-muted':         '#6B7280',
        'brand-text-dark':     '#0D1F17',
        // Shadcn/ui tokens
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:   { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent:      { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      backgroundImage: {
        'cta-gradient':  'linear-gradient(135deg, #F5E6C3, #C8962A)',
        'hero-gradient': 'linear-gradient(145deg, #1B5E3B, #0D3320)',
        'soft-gradient': 'linear-gradient(180deg, #FAFAF8, #E8F4EE, #F5E6C3)',
      },
      boxShadow: {
        'premium':    '0 4px 20px rgba(13,51,32,0.10)',
        'glow':       '0 0 30px rgba(200,150,42,0.15)',
        'card-hover': '0 12px 30px rgba(13,51,32,0.15)',
      },
      borderRadius: {
        lg:   'var(--radius)',
        md:   'calc(var(--radius) - 2px)',
        sm:   'calc(var(--radius) - 4px)',
        card: '12px',
        pill: '20px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

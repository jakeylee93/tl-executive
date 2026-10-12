import type { Config } from 'tailwindcss'

// Colours resolve to CSS custom properties (app/globals.css) so the anyOS
// "Site settings" panel can retune the brand colours live. See DESIGN.md.
const token = (name: string) => `var(--tl-${name})`

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        white: token('white'),
        mist: token('mist'),
        cloud: token('cloud'),
        silver: token('silver'),
        steel: token('steel'),
        ink: token('ink'),
        'ink-2': token('ink-2'),
        line: token('line'),
        field: token('field'),
        charcoal: token('charcoal'),
        'charcoal-2': token('charcoal-2'),
        'on-dark': token('on-dark'),
        'on-dark-muted': token('on-dark-muted'),
        focus: token('focus'),
        error: token('error'),
        success: token('success'),
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: { page: '78rem' },
      screens: { xs: '420px' },
    },
  },
  plugins: [],
}
export default config

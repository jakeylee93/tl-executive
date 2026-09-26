import type { Config } from 'tailwindcss'

// Colours resolve to CSS custom properties (see app/globals.css) so the
// anyOS "Site settings" panel can retune the two brand colours live without
// a rebuild. Keep this list in step with DESIGN.md.
const token = (name: string) => `var(--tl-${name})`

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}', './lib/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: token('paper'),
        surface: token('surface'),
        stone: token('stone'),
        ink: token('ink'),
        'ink-2': token('ink-2'),
        muted: token('muted'),
        line: token('line'),
        'line-strong': token('line-strong'),
        forest: token('forest'),
        'forest-2': token('forest-2'),
        'on-forest': token('on-forest'),
        'on-forest-muted': token('on-forest-muted'),
        brass: token('brass'),
        'brass-light': token('brass-light'),
        focus: token('focus'),
        error: token('error'),
        success: token('success'),
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      maxWidth: {
        page: '76rem',
      },
      screens: {
        xs: '420px',
      },
    },
  },
  plugins: [],
}
export default config

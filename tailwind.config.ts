import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        molt: {
          bg: '#0d1117',
          surface: '#161b22',
          card: '#21262d',
          accent: '#00ff41',
          text: '#e6edf3',
          muted: '#7d8590',
          green: '#00ff41',
          purple: '#a78bfa',
        },
      },
      fontFamily: {
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

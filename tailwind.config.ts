import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        molt: {
          bg: '#1a1a2e',
          surface: '#16213e',
          card: '#0f3460',
          accent: '#e94560',
          text: '#eaeaea',
          muted: '#8892a4',
          green: '#4ade80',
          orange: '#fb923c',
        },
      },
    },
  },
  plugins: [],
}
export default config

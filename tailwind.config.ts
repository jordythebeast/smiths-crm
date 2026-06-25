import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: '#CC0000',
          'red-dark': '#AA0000',
          black: '#000000',
        },
      },
    },
  },
  plugins: [],
}

export default config

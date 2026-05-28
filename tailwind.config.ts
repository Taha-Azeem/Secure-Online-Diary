// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class', // use class strategy
  content: [
    './index.html',
    './src/**/*.{tsx,ts,jsx,js}',
  ],
  theme: {
    extend: {
      colors: {
        cyan: '#06b6d4',
        purple: '#8b5cf6',
        green: '#10b981',
        red: '#ef4444',
        // map to Tailwind semantic names if needed
        primary: '#06b6d4', // cyan as primary accent
        secondary: '#8b5cf6',
        success: '#10b981',
        danger: '#ef4444',
      },
      backdropBlur: {
        'xl': '20px',
      },
    },
  },
  plugins: [],
};

export default config;

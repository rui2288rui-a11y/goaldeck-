import type { Config } from 'tailwindcss';

// CSS 変数（globals.css）を参照する色トークン。ライト/ダークは変数の差し替えだけで切り替わります。
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        surface2: token('surface2'),
        line: token('line'),
        ink: token('ink'),
        muted: token('muted'),
        brand: token('brand'),
        brand2: token('brand2'),
        accent: token('accent'),
        good: token('good'),
        bad: token('bad'),
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Hiragino Sans"',
          '"Hiragino Kaku Gothic ProN"',
          '"Noto Sans JP"',
          '"Yu Gothic UI"',
          '"Yu Gothic"',
          'Meiryo',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 10px 28px -14px rgb(15 20 50 / 0.18)',
        phone: '0 40px 100px -30px rgb(15 20 50 / 0.55)',
        glow: '0 18px 40px -16px rgb(79 70 229 / 0.7)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pop: {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, 12px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.06)', opacity: '0.85' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out both',
        pop: 'pop 0.25s ease-out both',
        'toast-in': 'toastIn 0.25s ease-out both',
        breathe: 'breathe 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;

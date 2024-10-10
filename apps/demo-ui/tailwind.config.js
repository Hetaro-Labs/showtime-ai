/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      transitionProperty: {
        spacing: 'margin, padding',
      },
      colors: {
        'background': '#0A0218',
      },
      keyframes: {
        hide: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideIn: {
          from: { transform: 'translateX(calc(100% + var(--viewport-padding)))' },
          to: { transform: 'translateX(0)' },
        },
        swipeOut: {
          from: { transform: 'translateX(var(--radix-toast-swipe-end-x))' },
          to: { transform: 'translateX(calc(100% + var(--viewport-padding)))' },
        },
        overlayShow: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        contentShow: {
          from: { opacity: '0', transform: 'translate(-50%, -48%) scale(0.96)' },
          to: { opacity: '1', transform: 'translate(-50%, -50%) scale(1)' },
        },
        roundedWave: {
          '0%, 100%': { borderRadius: '100% 100% 100% 100%' },
          '20%': { borderRadius: '80% 88% 92% 100%' },
          '40%': { borderRadius: '100% 80% 88% 92%' },
          '60%': { borderRadius: '92% 100% 80% 88%' },
          '80%': { borderRadius: '88% 92% 100% 80%' },
        }
      },
      animation: {
        overlayShow: 'overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        contentShow: 'contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        hide: 'hide 100ms ease-in',
        slideIn: 'slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        swipeOut: 'swipeOut 100ms ease-out',
      },
      fontFamily: {
        sans: [
          'Inter, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
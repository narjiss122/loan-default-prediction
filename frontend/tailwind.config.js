/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Tailwind's preflight reads theme('fontFamily.sans') for the global
        // default, so extending it here applies Inter app-wide automatically.
        sans: [
          'Inter', 'ui-sans-serif', 'system-ui', '-apple-system',
          'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"',
          'Arial', 'sans-serif',
        ],
      },
      colors: {
        // Brand primary — muted forest/emerald green. Used for primary buttons,
        // active states, and (via `success`) LOW RISK / ACCEPTED indicators.
        primary: {
          50:  '#f0f9f4',
          100: '#dbf0e3',
          200: '#b8e0c8',
          300: '#8cc9a8',
          400: '#5fae85',
          500: '#3f9367',
          600: '#2f7a52', // main: buttons, active nav, links
          700: '#266143', // hover/pressed
          800: '#1f4d36',
          900: '#1a3f2d',
        },
        // Semantic alias of primary — same hue, used for success states
        // (ACCEPTED, LOW RISK) so component code can read as intent, not brand.
        success: {
          50:  '#f0f9f4',
          100: '#dbf0e3',
          200: '#b8e0c8',
          300: '#8cc9a8',
          400: '#5fae85',
          500: '#3f9367',
          600: '#2f7a52',
          700: '#266143',
          800: '#1f4d36',
          900: '#1a3f2d',
        },
        // Restrained red — HIGH RISK, REFUSED, destructive actions.
        // Deliberately desaturated, not Tailwind's bright red-500.
        danger: {
          50:  '#fdf2f2',
          100: '#fbe1e1',
          200: '#f5c2c2',
          300: '#e89a9a',
          400: '#d97070',
          500: '#c84c4c',
          600: '#b13a3a', // main
          700: '#8f2e2e',
          800: '#6f2424',
          900: '#5c1f1f',
        },
        // Restrained amber — pending/in-progress states (SUBMITTED).
        warning: {
          50:  '#fefaf0',
          100: '#fcefcf',
          200: '#f7dd99',
          300: '#efc665',
          400: '#e3ad3f',
          500: '#cf9530',
          600: '#b07726', // main
          700: '#8c5d1f',
          800: '#6c481a',
          900: '#573a17',
        },
      },
      borderRadius: {
        card: '1rem', // 16px — soft, slightly more rounded than default xl
      },
    },
  },
  plugins: [],
}

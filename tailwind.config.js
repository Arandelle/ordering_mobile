/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}", './app/**/*.{js,jsx,ts,tsx}',],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        /* =========================
           Brand Color (#ef4501)
        ========================== */
        brand: {
          50: '#fff4ee',
          100: '#ffe6d9',
          200: '#ffc9b3',
          300: '#ff9f80',
          400: '#ff6f40',
          500: '#ef4501',
          600: '#cc3b01',
          700: '#a53101',
          800: '#7f2600',
          900: '#5c1b00',
        },

        /* =========================
           Dark Green (#093500)
        ========================== */
        'dark-green': {
          50: '#eef7ed',
          100: '#d7ebd5',
          200: '#add8a9',
          300: '#7fbe79',
          400: '#4f9f4a',
          500: '#1f7a1a',
          600: '#145f10',
          700: '#0f4a0c',
          800: '#093500',
          900: '#062800',
        },

        /* =========================
           Mustard (#f8b31f)
        ========================== */
        mustard: {
          50: '#fff9e6',
          100: '#fff1bf',
          200: '#ffe38a',
          300: '#ffd24d',
          400: '#f8c233',
          500: '#f8b31f',
          600: '#d99817',
          700: '#b37e12',
          800: '#8c630e',
          900: '#664809',
        },

        /* =========================
           Brand Yellow (#f8f801)
        ========================== */
        'brand-yellow': {
          50: '#ffffe6',
          100: '#ffffb3',
          200: '#ffff80',
          300: '#ffff4d',
          400: '#ffff1a',
          500: '#f8f801',
          600: '#d6d600',
          700: '#adad00',
          800: '#858500',
          900: '#5c5c00',
        },

        /* =========================
           Brand Brown (#501200)
        ========================== */
        'brand-brown': {
          50: '#f6ebe7',
          100: '#e4c9c1',
          200: '#c98f82',
          300: '#a95a4a',
          400: '#7a2d1f',
          500: '#501200',
          600: '#421000',
          700: '#340c00',
          800: '#260900',
          900: '#190500',
        },
      },
    },
  },
  plugins: [],
}
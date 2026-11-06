/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        sian: {
          bg: '#101822',
          deep: '#0a1018',
          panel: '#1a2533',
          raised: '#243246',
          line: '#2f4158',
          text: '#d6e0ea',
          muted: '#8fa3b8',
          accent: '#5db8f0',
          buy: '#6fa32e',
          buyhover: '#82bd38',
          price: '#b6e35e',
          star: '#f2c14e',
        },
      },
      fontFamily: {
        sans: ['Sarabun', 'Segoe UI', 'Tahoma', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

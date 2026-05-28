/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: { 50:'#e4e4ef',100:'#c8c8d8',200:'#9898a8',300:'#8888a0',400:'#6b6b80',500:'#4a4a60',600:'#2a2a3a',700:'#1e1e28',800:'#18181f',900:'#0f0f13',950:'#08080c' },
        accent: { DEFAULT:'#6c5ce7',light:'#a29bfe',dark:'#5a4bd1' },
        success: '#00b894', warning: '#fdcb6e', danger: '#e17055', info: '#74b9ff',
      },
      fontFamily: { sans:['Inter','Segoe UI','system-ui','sans-serif'], mono:['JetBrains Mono','Fira Code','monospace'] },
    },
  },
  plugins: [],
}

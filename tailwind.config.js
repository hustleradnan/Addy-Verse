export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0a1a2f',
        },
        gold: {
          50: '#fdf8ec',
          100: '#faeec9',
          200: '#f5dc9a',
          300: '#f0c666',
          400: '#ecb13d',
          500: '#dc9a26',
          600: '#bd7b1d',
          700: '#975f1c',
          800: '#7c4d1d',
          900: '#68411c',
        },
      },
      boxShadow: {
        card: '0 4px 20px rgba(16, 42, 67, 0.08)',
        cardHover: '0 8px 30px rgba(16, 42, 67, 0.15)',
      },
    },
  },
  plugins: [],
}

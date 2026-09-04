/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        linen: '#FAF6F1',
        plum: '#4A2E3B',
        rose: '#C97B84',
        'rose-light': '#EBD3D6',
        sage: '#7E9788',
        'sage-light': '#DCE6DF',
        mustard: '#D9A441',
        'mustard-light': '#F4E3BE',
        clay: '#B5555F'
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Karla', 'sans-serif']
      },
      borderRadius: {
        soft: '18px'
      }
    }
  },
  plugins: []
}

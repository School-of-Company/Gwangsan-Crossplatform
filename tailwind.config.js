/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,ts,tsx}', 
    './src/**/*.{js,ts,tsx}', 
    './components/**/*.{js,ts,tsx}'
  ],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontSize: {
        titleLarge: ['30px', { lineHeight: '120%', fontWeight: '600' }],
        titleMedium: ['26px', { lineHeight: '120%', fontWeight: '600' }],
        titleSmall: ['20px', { lineHeight: '130%', fontWeight: '600' }],
        body2: ['18px', { lineHeight: '140%', fontWeight: '400' }],
        body3: ['16px', { lineHeight: '140%', fontWeight: '600' }],
        body4: ['16px', { lineHeight: '140%', fontWeight: '400' }],
        body5: ['14px', { lineHeight: '140%', fontWeight: '400' }],
        label: ['14px', { lineHeight: '140%', fontWeight: '500' }],
        caption: ['12px', { lineHeight: '140%', fontWeight: '400' }],
      },
      colors: {
        sub: {
          900: '#001727',
          800: '#002F4E',
          700: '#004674',
          600: '#005E9B',
          500: '#0075C2',
          400: '#3391CE',
          300: '#66ACDA',
          200: '#99C8E7',
          100: '#CCE3F3',
        },
        main: {
          900: '#1D2706',
          800: '#394E0C',
          700: '#567511',
          600: '#729C17',
          500: '#8FC31D',
          400: '#A5CF4A',
          300: '#BCDB77',
          200: '#D2E7A5',
          100: '#E9F3D2',
        },
        sub2: {
          900: '#312200',
          800: '#624500',
          700: '#946701',
          600: '#C58A01',
          500: '#F6AC01',
          400: '#F8BD34',
          300: '#FACD67',
          200: '#FBDE99',
          100: '#FDEECC',
        },
        error: {
          500: '#DF454A',
        },
        gray: {
          900: '#3C3C3E',
          800: '#4F4F51',
          700: '#666669',
          600: '#828387',
          500: '#8F9094',
          400: '#A5A6A9',
          300: '#B4B5B7',
          200: '#DBDCDE',
          100: '#EFF0F2',
          50: '#F5F6F8',
        },
      },
    },
  },
  plugins: [],
};

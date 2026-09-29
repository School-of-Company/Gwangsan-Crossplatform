/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './src/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        cafe24: ['Cafe24SsurroundOTF'],
      },
      fontSize: {
        titleLarge: ['30px', { lineHeight: '120%', fontWeight: '600' }],
        titleMedium: ['26px', { lineHeight: '120%', fontWeight: '600' }],
        titleMedium2: ['24px', { lineHeight: '120%', fontWeight: '600' }],
        titleSmall: ['20px', { lineHeight: '130%', fontWeight: '600' }],
        body1: ['18px', { lineHeight: '140%', fontWeight: '600' }],
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
          900: 'rgb(var(--color-gray-900) / <alpha-value>)',
          800: 'rgb(var(--color-gray-800) / <alpha-value>)',
          700: 'rgb(var(--color-gray-700) / <alpha-value>)',
          600: 'rgb(var(--color-gray-600) / <alpha-value>)',
          500: 'rgb(var(--color-gray-500) / <alpha-value>)',
          400: 'rgb(var(--color-gray-400) / <alpha-value>)',
          300: 'rgb(var(--color-gray-300) / <alpha-value>)',
          200: 'rgb(var(--color-gray-200) / <alpha-value>)',
          100: 'rgb(var(--color-gray-100) / <alpha-value>)',
          50: 'rgb(var(--color-gray-50) / <alpha-value>)',
        },
        // 의미 색 토큰: 시스템 라이트/다크 설정에 따라 global.css의 CSS 변수 값이 바뀐다
        background: 'rgb(var(--color-background) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--color-surface) / <alpha-value>)',
          muted: 'rgb(var(--color-surface-muted) / <alpha-value>)',
        },
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
      },
    },
  },
  plugins: [],
};

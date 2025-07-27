/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            maxWidth: '80ch',
          },
        },
      }),
      colors: {
        accent: '#2337ff',
        'accent-dark': '#000d8a',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
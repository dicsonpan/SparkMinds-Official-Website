/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Hiragino Sans GB"', 'sans-serif'],
        portfolioSans: ['"Noto Sans SC"', '"PingFang SC"', '"Hiragino Sans GB"', 'sans-serif'],
        portfolioTech: ['"Space Grotesk"', '"Noto Sans SC"', 'sans-serif'],
        portfolioAcademic: ['"Noto Serif SC"', '"Songti SC"', 'serif'],
        portfolioCreative: ['"ZCOOL XiaoWei"', '"Noto Sans SC"', 'serif'],
      },
      animation: {
        blob: "blob 7s infinite",
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
}

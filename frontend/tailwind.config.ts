import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        artisan: {
          terracotta: "#C85A32",
          "terracotta-dark": "#9E4121",
          gold: "#D99B26",
          indigo: "#1E293B",
          sand: "#FDFBF7",
          warm: "#FAF4EB",
          emerald: "#059669",
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        card: "0 4px 20px -2px rgba(200, 90, 50, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;

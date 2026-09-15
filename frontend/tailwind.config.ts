import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mint: "#F4FBF9", teal: "#56B9AD", deepteal: "#1F5960", ink: "#173E48", body: "#52656A",
      },
      boxShadow: { calm: "0 10px 30px rgba(31, 89, 96, 0.08)" },
    },
  },
  plugins: [],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calm, accessible palette for a mental health app
        calm: {
          50:  "#f0f7ff",
          100: "#e0efff",
          200: "#baddff",
          300: "#7ec2ff",
          400: "#38a0ff",
          500: "#0d7fe8",
          600: "#0062c6",
          700: "#004fa1",
          800: "#064485",
          900: "#0b3b6e",
        },
        sage: {
          50:  "#f4f9f4",
          100: "#e6f2e6",
          200: "#cce5cc",
          300: "#a3cfa3",
          400: "#70b270",
          500: "#4d944d",
          600: "#3b763b",
          700: "#315e31",
          800: "#2a4d2a",
          900: "#234023",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

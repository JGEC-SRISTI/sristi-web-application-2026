import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages project sites live under /<repository>/; custom domains use /.
  base: process.env.VITE_BASE_PATH
    ? `${process.env.VITE_BASE_PATH.replace(/\/$/, "")}/`
    : "/",
  plugins: [
    react(),
    tailwindcss(),
  ],
});

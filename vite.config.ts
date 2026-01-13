import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const base = "/MirageHime/";
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    base: base,
    plugins: [react()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(
        "AIzaSyBTRmInhNKbAelMC3PEk6W59jPLdbIaFcA"
      ),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});

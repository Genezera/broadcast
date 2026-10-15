/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: "0.0.0.0" },
  // O SDK do Firebase sozinho passa de 500 kB; as telas já são carregadas sob demanda.
  build: { chunkSizeWarningLimit: 800 },
  test: {
    // Threads em vez de processos: evita um crash intermitente do Node 24 no Windows.
    pool: "threads",
    environment: "node",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    env: { TZ: "America/Sao_Paulo" },
  },
});

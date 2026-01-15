import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    include: ["test/**/*.controller-spec.ts"],
    setupFiles: ["./test/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.dto.ts", "src/**/*.module.ts", "src/main.ts"],
    },
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});

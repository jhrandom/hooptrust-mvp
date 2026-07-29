import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["lib/media-url.ts", "lib/stat-validation.ts", "lib/rhythm-data.ts", "lib/utils.ts"],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 }
    }
  }
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    clearMocks: true,
    coverage: {
      include: ["src/lib/validators/**/*.ts", "src/server/services/**/*.ts"],
    },
  },
});

import { defineConfig } from "vitest/config";
import * as path from "path";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
    },
    resolve: {
        extensions: [".ts", ".js"],
        alias: {
            "@": path.resolve(__dirname, "src"),
        },
    },
});
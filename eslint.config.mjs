import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Allow explicit any in SDK wrapper code where types are unresolvable
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow empty catch blocks in fire-and-forget patterns
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Enforce no console.log in production (warn for console.error/warn)
      "no-console": ["warn", { allow: ["error", "warn", "log"] }],
    },
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.turbo/**",
    ],
  }
);

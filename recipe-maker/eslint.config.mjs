import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React rules - disable overly strict formatting rules
      "react/no-unescaped-entities": "off", // Allow apostrophes and quotes in JSX

      // TypeScript rules - allow some flexibility
      "@typescript-eslint/no-explicit-any": "warn", // Warn instead of error for any types
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_", // Allow unused args starting with _
        "varsIgnorePattern": "^_", // Allow unused vars starting with _
        "destructuredArrayIgnorePattern": "^_" // Allow unused destructured array elements starting with _
      }],

      // Next.js rules - relax some image optimization warnings
      "@next/next/no-img-element": "off", // Disable img element rule

      // React Hooks rules - allow some flexibility for complex cases
      "react-hooks/incompatible-library": "warn", // Warn for React Hook Form memoization issues

      // General code quality
      "prefer-const": "error", // Enforce const for variables that are never reassigned
      "no-console": ["warn", { "allow": ["warn", "error"] }], // Allow console.warn and console.error
    }
  },
  {
    // Allow console.log in seed files and scripts
    files: ["**/seed.ts", "**/scripts/**/*.ts"],
    rules: {
      "no-console": "off"
    }
  }
]);

export default eslintConfig;

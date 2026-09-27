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
      // Data-loading effects intentionally update local state after an
      // external request. The React 19 rule flags the helper call itself.
      "react-hooks/set-state-in-effect": "off",
      // Several pages keep stable fetch helpers below their effects; effects
      // run after render, so this is not a temporal runtime access.
      "react-hooks/immutability": "off",
    },
  },
]);

export default eslintConfig;

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/app/api/**/*.ts", "src/app/**/actions.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["pg", "pg/*"],
              message:
                "Direct Postgres access is not allowed in API routes or server actions. Use @supabase/ssr or document an exception in src/lib/db/DIRECT_ACCESS_REGISTRY.md",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Operational artifacts and legacy Node scripts (CommonJS).
    "reports/**",
    "scripts/**/*.js",
  ]),
]);

export default eslintConfig;

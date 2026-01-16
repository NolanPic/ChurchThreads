import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      // Disable new strict rules from react-hooks that weren't in previous version
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/refs": "off",
    },
  },
  {
    files: ["**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      // Allow hooks in Storybook render functions
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    ignores: ["convex/_generated/**", ".storybook-static/**"],
  },
];

export default eslintConfig;

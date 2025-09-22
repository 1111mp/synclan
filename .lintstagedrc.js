/**
 * @filename: .lintstagedrc.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  '**/*.{js,mjs,cjs,ts,jsx,tsx,md,html,css}': [
    'prettier --write',
    'oxlint --type-aware',
  ],
};

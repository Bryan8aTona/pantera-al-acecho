import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist/'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      // El proyecto no usa PropTypes.
      'react/prop-types': 'off',
    },
  },
  {
    files: ['vite.config.js', 'eslint.config.js', 'src/test-setup.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  // Va al final: apaga las reglas de estilo que se pelean con Prettier.
  prettier,
];

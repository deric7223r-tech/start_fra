import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['dist/**'],
  },
);

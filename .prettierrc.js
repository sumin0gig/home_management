module.exports = {
  arrowParens: 'avoid',
  bracketSameLine: false,
  bracketSpacing: true,
  singleQuote: true,
  trailingComma: 'all',
  overrides: [
    {
      files: ['src/components/**/*.{ts,tsx}', 'src/screens/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
      options: {
        singleQuote: false,
      },
    },
  ],
};

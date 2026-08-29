module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      files: ['src/components/**/*.{ts,tsx}', 'src/screens/**/*.{ts,tsx}', '__tests__/**/*.{ts,tsx}'],
      rules: {
        quotes: ['warn', 'double', { avoidEscape: true }],
      },
    },
  ],
};

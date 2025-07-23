module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react',
    'react-hooks'
  ],
  rules: {
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'never'],
    'no-unused-vars': ['warn'],
    'react/prop-types': ['off'],
    'react/react-in-jsx-scope': ['off']
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/'
  ]
}
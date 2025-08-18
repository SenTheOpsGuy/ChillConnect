module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    // Allow console.log in scripts
    'no-console': 'off',
    // Security scripts need to be more permissive
    'no-useless-escape': 'off',
  },
}

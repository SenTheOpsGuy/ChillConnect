module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Error prevention
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-unused-vars': ['error', { 
      vars: 'all', 
      args: 'after-used', 
      ignoreRestSiblings: false 
    }],
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'error',
    
    // Code quality
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'template-curly-spacing': ['error', 'never'],
    
    // Style consistency
    'indent': ['error', 2, { SwitchCase: 1 }],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'never'],
    'comma-dangle': ['error', 'always-multiline'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', {
      anonymous: 'always',
      named: 'never',
      asyncArrow: 'always'
    }],
    
    // Best practices
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-throw-literal': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'no-useless-call': 'error',
    'no-useless-concat': 'error',
    'no-useless-return': 'error',
    'radix': 'error',
    'require-await': 'error',
    'yoda': 'error',
    
    // Security
    'no-new-require': 'error',
    'no-path-concat': 'error',
  },
  overrides: [
    // Frontend React rules
    {
      files: ['frontend/**/*.{js,jsx}'],
      env: {
        browser: true,
        es2022: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
      ],
      plugins: [
        'react',
        'react-hooks',
        'jsx-a11y',
      ],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        // React specific
        'react/prop-types': 'warn',
        'react/no-unused-prop-types': 'warn',
        'react/no-array-index-key': 'warn',
        'react/jsx-key': 'error',
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-no-undef': 'error',
        'react/jsx-uses-react': 'error',
        'react/jsx-uses-vars': 'error',
        'react/no-direct-mutation-state': 'error',
        'react/no-unknown-property': 'error',
        'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
        
        // React Hooks
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        
        // Accessibility
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/anchor-has-content': 'error',
        'jsx-a11y/aria-props': 'error',
        'jsx-a11y/aria-proptypes': 'error',
        'jsx-a11y/aria-unsupported-elements': 'error',
        'jsx-a11y/heading-has-content': 'error',
        'jsx-a11y/img-redundant-alt': 'error',
        'jsx-a11y/no-access-key': 'error',
        'jsx-a11y/role-has-required-aria-props': 'error',
        'jsx-a11y/role-supports-aria-props': 'error',
      },
    },
    // Backend Node.js rules
    {
      files: ['backend/**/*.js'],
      env: {
        node: true,
        es2022: true,
      },
      extends: [
        'eslint:recommended',
        'plugin:node/recommended',
        'plugin:security/recommended',
      ],
      plugins: [
        'node',
        'security',
      ],
      rules: {
        // Node.js specific
        'node/no-unsupported-features/es-syntax': 'off',
        'node/no-missing-import': 'off',
        'node/no-missing-require': 'error',
        'node/no-unpublished-require': 'off',
        'node/no-extraneous-require': 'error',
        'node/prefer-global/process': 'error',
        'node/prefer-promises/fs': 'error',
        'node/no-new-require': 'error',
        'node/no-path-concat': 'error',
        
        // Security
        'security/detect-buffer-noassert': 'error',
        'security/detect-child-process': 'warn',
        'security/detect-disable-mustache-escape': 'error',
        'security/detect-eval-with-expression': 'error',
        'security/detect-new-buffer': 'error',
        'security/detect-no-csrf-before-method-override': 'error',
        'security/detect-non-literal-fs-filename': 'warn',
        'security/detect-non-literal-regexp': 'error',
        'security/detect-object-injection': 'warn',
        'security/detect-possible-timing-attacks': 'warn',
        'security/detect-pseudoRandomBytes': 'error',
        'security/detect-unsafe-regex': 'error',
      },
    },
    // Test files
    {
      files: ['**/*.test.{js,jsx}', '**/__tests__/**/*.{js,jsx}', '**/e2e/**/*.{js,jsx}'],
      env: {
        jest: true,
        browser: true,
        node: true,
      },
      extends: [
        'plugin:testing-library/react',
        'plugin:jest/recommended',
      ],
      plugins: [
        'testing-library',
        'jest',
      ],
      rules: {
        // Jest specific
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',
        
        // Testing Library
        'testing-library/await-async-query': 'error',
        'testing-library/no-await-sync-query': 'error',
        'testing-library/no-debugging-utils': 'warn',
        'testing-library/no-dom-import': 'error',
        
        // Allow console in tests
        'no-console': 'off',
      },
    },
  ],
}
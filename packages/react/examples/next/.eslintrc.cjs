const path = require('node:path');

module.exports = {
  extends: 'next/core-web-vitals',
  rules: {
    '@next/next/no-html-link-for-pages': ['error', path.resolve(__dirname)],
  },
};

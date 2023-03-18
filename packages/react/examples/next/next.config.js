// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('node:path');
const baseDir = path.resolve(__dirname, '..', '..', '..', '..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@blocksuite/editor',
    '@blocksuite/blocks',
    '@blocksuite/store',
    '@blocksuite/react',
    '@blocksuite/phasor',
    '@blocksuite/global',
  ],
  webpack: config => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      '@blocksuite/editor': path.resolve(baseDir, 'packages', 'editor'),
      '@blocksuite/blocks/content-parser': path.resolve(
        baseDir,
        'packages',
        'blocks',
        'src',
        'content-parser'
      ),
      '@blocksuite/blocks/models': path.resolve(
        baseDir,
        'packages',
        'blocks',
        'src',
        'models'
      ),
      '@blocksuite/blocks/std': path.resolve(
        baseDir,
        'packages',
        'blocks',
        'src',
        'std'
      ),
      '@blocksuite/blocks': path.resolve(baseDir, 'packages', 'blocks'),
      '@blocksuite/store': path.resolve(baseDir, 'packages', 'store'),
      '@blocksuite/phasor': path.resolve(baseDir, 'packages', 'phasor'),
      '@blocksuite/global/utils': path.resolve(
        baseDir,
        'packages',
        'global',
        'src',
        'utils'
      ),
    };
    return config;
  },
};

module.exports = nextConfig;

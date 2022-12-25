/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@blocksuite/editor',
    '@blocksuite/blocks',
    '@blocksuite/store',
  ],
  webpack: config => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
    };
    return config;
  },
};

module.exports = nextConfig;

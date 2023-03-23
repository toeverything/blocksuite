import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'BlockSuite',
  description: 'The Block-Based Collaborative Framework',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: 'Playground',
        link: 'https://blocksuite-toeverything.vercel.app/?init',
      },
      { text: 'Docs', link: '/introduction' },
      { text: 'API', link: '' },
      // { text: 'API', link: '/api-examples' }, // Vitepress demo
      { text: 'Examples', link: '' },
    ],

    sidebar: [
      {
        text: 'BlockSuite Documentation',
        items: [
          { text: 'Introduction', link: '/introduction' },
          { text: 'Editor Example', link: '/editor-example' },
          // { text: 'Runtime API Examples', link: '/api-examples' }, // Vitepress demo
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/toeverything/blocksuite' },
      { icon: 'twitter', link: 'https://twitter.com/AffineDev' },
    ],

    footer: {
      copyright: 'Copyright © 2022-present Toeverything',
    },
  },
  head: [
    [
      'link',
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: 'https://raw.githubusercontent.com/toeverything/blocksuite/master/assets/logo.svg',
      },
    ],
  ],
});

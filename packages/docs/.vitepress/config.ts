import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
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
      { text: '🚧 API', link: '' },
      { text: '🚧 Examples', link: '' },
    ],

    sidebar: [
      {
        text: 'Introduction',
        items: [{ text: 'Introduction', link: '/introduction' }],
      },
      {
        text: 'Using BlockSuite',
        items: [
          { text: 'Getting Started', link: '/getting-started' },
          {
            text: 'Fundamental Concepts',
            link: '/concepts',
            items: [
              {
                text: 'Workspaces and Pages',
                link: '/concepts#workspaces-and-pages',
              },
              {
                text: 'Flavoured Blocks',
                link: '/concepts#flavoured-blocks',
              },
            ],
          },
          { text: '🚧 Collaboration and Data Persistence', link: '' },
          { text: '🚧 Defining Your Block', link: '' },
          { text: '🚧 Building Your Framework', link: '' },
          { text: 'Editor Example', link: '/editor-example' },
          // { text: 'Runtime API Examples', link: '/api-examples' }, // Vitepress demo
        ],
      },
      {
        text: 'Architecture In-Depth',
        items: [
          { text: '🚧 Unidirectional Data Flow', link: '' },
          {
            text: '🚧 Common Patterns',
            items: [
              { text: '🚧 Controlled Components', link: '' },
              { text: '🚧 Rich Text Orchestration', link: '' },
              { text: '🚧 Container Blocks', link: '' },
            ],
          },
        ],
      },
      {
        text: '🚧 API Reference',
        items: [],
      },
      {
        text: 'Developing BlockSuite',
        items: [
          { text: '🚧 Building the Packages', link: '' },
          { text: '🚧 Making Contributions', link: '' },
          { text: '🚧 Testing', link: '' },
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

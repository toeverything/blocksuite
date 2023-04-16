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
          { text: 'Workspaces and Pages', link: '/workspaces-and-pages' },
          { text: 'Flavoured Blocks', link: '/flavoured-blocks' },
          { text: 'Handling Events', link: '/handling-events' },
          { text: 'Using Editor', link: '/using-editor' },
          { text: 'Data Persistence', link: '/data-persistence' },
        ],
      },
      {
        text: 'Editor Architecture',
        items: [
          {
            text: 'Unidirectional Data Flow',
            link: '/unidirectional-data-flow',
          },
          {
            text: '🚧 Framework UI Patterns',
            items: [
              { text: '🚧 Rich Text Orchestration', link: '' },
              { text: '🚧 Controlled Component', link: '' },
              { text: '🚧 Block Host', link: '' },
            ],
          },
          { text: '🚧 Defining Editable Block', link: '' },
        ],
      },
      {
        text: '🚧 API Reference',
        items: [],
      },
      {
        text: 'Packages',
        items: [
          { text: '🚧 <code>@blocksuite/store</code>', link: '' },
          { text: '🚧 <code>@blocksuite/blocks</code>', link: '' },
          { text: '🚧 <code>@blocksuite/editor</code>', link: '' },
          { text: '🚧 <code>@blocksuite/virgo</code>', link: '' },
          { text: '🚧 <code>@blocksuite/phasor</code>', link: '' },
          { text: '🚧 <code>@blocksuite/connector</code>', link: '' },
        ],
      },
      {
        text: 'Developing BlockSuite',
        items: [
          { text: '🚧 Building Packages', link: '' },
          { text: '🚧 Running Tests', link: '' },
          { text: '🚧 Making Contributions', link: '' },
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

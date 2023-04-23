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
          {
            text: 'Attaching Editor',
            link: '/attaching-editor',
          },
          { text: 'Data Persistence', link: '/data-persistence' },
        ],
      },
      {
        text: 'AFFiNE Editor Overview',
        items: [
          {
            text: 'Unidirectional Data Flow',
            link: '/unidirectional-data-flow',
          },
          {
            text: 'Editor UI Architecture',
            link: '/editor-ui-architecture',
            items: [
              {
                text: 'Editors as Hosts',
                link: '/editors-as-hosts',
              },
              {
                text: 'Rich Text Orchestration',
                link: '/rich-text-orchestration',
              },
              {
                text: 'Framework Integration',
                link: '/framework-integration',
              },
            ],
          },
          {
            text: 'Defining Editable Blocks',
            link: '/defining-editable-blocks',
          },
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
        ],
      },
      {
        text: 'Developing BlockSuite',
        items: [
          {
            text: 'Building Packages',
            link: 'https://github.com/toeverything/blocksuite/blob/master/BUILDING.md',
          },
          {
            text: 'Running Tests',
            link: 'https://github.com/toeverything/blocksuite/blob/master/BUILDING.md#testing',
          },
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

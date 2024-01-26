import { DefaultTheme, defineConfig } from 'vitepress';
import wasm from 'vite-plugin-wasm';
import container from 'markdown-it-container';
import { renderSandbox } from 'vitepress-plugin-sandpack';

const guide: DefaultTheme.NavItem[] = [
  {
    text: 'Getting Started',
    items: [
      { text: 'Overview', link: 'guide/overview' },
      { text: 'Quick Start', link: 'guide/quick-start' },
    ],
  },
  {
    text: 'Framework Tutorial',
    items: [
      { text: 'Component Types', link: 'guide/component-types' },
      {
        text: 'Working with Block Tree',
        // @ts-ignore
        link: 'guide/working-with-block-tree',
        items: [
          {
            text: 'Block Tree Basics',
            link: 'guide/working-with-block-tree#block-tree-basics',
          },
          {
            text: 'Block Tree in Editor',
            link: 'guide/working-with-block-tree#block-tree-in-editor',
          },
          {
            text: 'Selecting Blocks',
            link: 'guide/working-with-block-tree#selecting-blocks',
          },
          {
            text: 'Service and Commands',
            link: 'guide/working-with-block-tree#service-and-commands',
          },
          {
            text: 'Defining New Blocks',
            link: 'guide/working-with-block-tree#defining-new-blocks',
          },
        ],
      },
      { text: 'Data Synchronization', link: 'guide/data-synchronization' },
    ],
  },
  {
    text: 'API Walkthrough',
    items: [
      {
        text: '<code>block-std</code>',
        items: [
          {
            text: 'Block Spec',
            link: 'guide/block-spec',
            // @ts-ignore
            items: [
              { text: 'Block Schema', link: 'guide/block-schema' },
              { text: 'Block Service', link: 'guide/block-service' },
              { text: 'Block View', link: 'guide/block-view' },
              { text: 'Block Widgets', link: 'guide/block-widgets' },
            ],
          },
          {
            text: 'Selection',
            link: 'guide/selection',
          },
          { text: 'Event', link: 'guide/event' },
          { text: 'Command', link: 'guide/command' },
        ],
      },
      {
        text: '<code>store</code>',
        items: [
          { text: 'Page', link: 'guide/store#page' },
          { text: 'Workspace', link: 'guide/store#workspace' },
          { text: 'Slot', link: 'guide/slot' },
          { text: 'Adapter', link: 'guide/adapter' },
        ],
      },
      {
        text: '<code>inline</code>',
        link: 'guide/inline',
      },
      {
        text: '<code>lit</code>',
        link: 'guide/lit',
      },
    ],
  },
  {
    text: 'Developing BlockSuite',
    items: [
      {
        text: 'Building Packages',
        link: '//github.com/toeverything/blocksuite/blob/master/BUILDING.md',
      },
      {
        text: 'Running Tests',
        link: '//github.com/toeverything/blocksuite/blob/master/BUILDING.md#testing',
      },
    ],
  },
];

const reference: DefaultTheme.NavItem[] = [
  {
    text: 'API Reference',
    items: [
      { text: '@blocksuite/store', link: 'api/@blocksuite/store/index' },
      {
        text: '@blocksuite/block-std',
        link: 'api/@blocksuite/block-std/index',
      },
      { text: '@blocksuite/lit', link: 'api/@blocksuite/lit/index' },
      { text: '@blocksuite/inline', link: 'api/@blocksuite/inline/index' },
      {
        text: '@blocksuite/presets',
        link: 'api/@blocksuite/presets/index',
      },
      { text: '@blocksuite/blocks', link: 'api/@blocksuite/blocks/index' },
    ],
  },
];

const presets: DefaultTheme.NavItem[] = [
  { text: '📝 DocEditor', link: 'presets/doc-editor' },
  { text: '🎨 EdgelessEditor', link: 'presets/edgeless-editor' },
];

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: {
    build: {
      target: 'ES2022',
    },
    plugins: [wasm()],
  },
  lang: 'en-US',
  title: 'BlockSuite',
  description: 'Content Editing Tech Stack for the Web',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: 'Presets',
        items: [
          { text: '📝 DocEditor', link: '/presets/doc-editor' },
          { text: '🎨 EdgelessEditor', link: '/presets/edgeless-editor' },
        ],
      },
      { text: 'Guide', link: '/guide/overview' },
      { text: 'API', link: '/api/' },
      // { text: 'Blog', link: '/blog/' },
      {
        text: 'Releases',
        link: 'https://github.com/toeverything/blocksuite/releases',
      },
    ],

    sidebar: {
      '/guide/': { base: '/', items: guide },
      '/api/': { base: '/', items: reference },
      '/presets/': { base: '/', items: presets },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/toeverything/blocksuite' },
      {
        icon: {
          svg: '<svg role="img" xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2023 Fonticons, Inc.--><path fill="#777777" d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/></svg>',
        },
        link: 'https://twitter.com/AffineDev',
      },
    ],

    footer: {
      copyright: 'Copyright © 2022-present Toeverything',
    },

    search: {
      provider: 'local',
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
  markdown: {
    config(md) {
      md.use(container, 'code-sandbox', {
        render(tokens, idx) {
          return renderSandbox(tokens, idx, 'code-sandbox');
        },
      });
    },
  },
});

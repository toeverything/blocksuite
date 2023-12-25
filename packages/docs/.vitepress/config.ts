import { defineConfig } from 'vitepress';
import wasm from 'vite-plugin-wasm';
import container from 'markdown-it-container';
import { renderSandbox } from 'vitepress-plugin-sandpack';

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
  description: 'Toolkit for Diverse Content Editing',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: 'Editors',
        items: [
          { text: '🚧 DocEditor', link: '#' },
          { text: '🚧 EdgelessEditor', link: '#' },
        ],
      },
      {
        text: 'Playground',
        link: 'https://try-blocksuite.vercel.app/starter/?init',
      },
      { text: 'Docs', link: '/blocksuite-overview' },
      {
        text: 'Releases',
        link: 'https://github.com/toeverything/blocksuite/releases',
      },
    ],

    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/blocksuite-overview' },
          { text: 'Quick Start', link: '/quick-start' },
        ],
      },
      {
        text: 'Essentials',
        items: [
          { text: 'Block Basics', link: '/block-basics' },
          { text: 'Data Persistence', link: '/data-persistence' },
          { text: '🚧 Customize Blocks' },
        ],
      },
      {
        text: 'Editor In-Depth',
        items: [
          { text: '🚧 Design Philosophy' },
          {
            text: 'CRDT-Native Data Flow',
            link: '/crdt-native-data-flow',
          },
        ],
      },
      {
        text: 'API Walkthrough',
        items: [
          { text: 'Selection API', link: '/selection-api' },
          { text: 'Event API', link: '/event-api' },
          {
            text: 'Block Spec APIs',
            link: '/block-spec-apis',
            items: [
              { text: 'Block Schema', link: '/block-schema' },
              { text: 'Block Service', link: '/block-service' },
              { text: 'Block View', link: '/block-view' },
              { text: 'Block Widgets', link: '/block-widgets' },
            ],
          },
          { text: 'Command API', link: '/command-api' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: '@blocksuite/store', link: '/api/@blocksuite/store/index' },
          {
            text: '@blocksuite/block-std',
            link: '/api/@blocksuite/block-std/index',
          },
          { text: '@blocksuite/lit', link: '/api/@blocksuite/lit/index' },
          { text: '@blocksuite/inline', link: '/api/@blocksuite/inline/index' },
          {
            text: '@blocksuite/presets',
            link: '/api/@blocksuite/presets/index',
          },
          // { text: '🚧 @blocksuite/blocks', link: '/api/@blocksuite/blocks/index' },
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

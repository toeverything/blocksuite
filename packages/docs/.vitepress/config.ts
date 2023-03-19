import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'BlockSuite',
  description: 'The Block-Based Collaborative Framework',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      // { text: 'Home', link: '/' },
      {
        text: 'Playground',
        link: 'https://blocksuite-toeverything.vercel.app/?init',
      },
      { text: 'Docs', link: '/markdown-examples' },
      { text: 'API', link: '/api-examples' },
      { text: 'Examples', link: '' },
    ],

    sidebar: [
      {
        text: 'BlockSuite Documentation',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
      { icon: 'twitter', link: 'https://twitter.com/AffineDev' },
    ],
  },
});

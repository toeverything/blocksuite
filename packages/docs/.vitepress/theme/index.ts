// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import Theme from 'vitepress/theme';
import Logo from './components/logo.vue';
import Playground from './components/playground.vue';
import BlogListLayout from './components/blog-list-layout.vue';
import BlogPostMeta from './components/blog-post-meta.vue';
import CodeSandbox from './components/code-sandbox.vue';
import 'vitepress-plugin-sandpack/dist/style.css';
import './style.css';

export default {
  ...Theme,
  Layout: () => {
    return h(Theme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-hero-image': () => h(Logo),
      // 'home-features-after': () => h(Playground),
    });
  },
  enhanceApp({ app, router, siteData }) {
    app.component('BlogListLayout', BlogListLayout);
    app.component('BlogPostMeta', BlogPostMeta);
    app.component('CodeSandbox', CodeSandbox);
  },
};

// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import Theme from 'vitepress/theme';
import Icon from './components/Icon.vue';
import HeroLogo from './components/HeroLogo.vue';
import BlogListLayout from './components/BlogListLayout.vue';
import BlogPostMeta from './components/BlogPoseMeta.vue';
import CodeSandbox from './components/CodeSandbox.vue';
import 'vitepress-plugin-sandpack/dist/style.css';
import './style.css';

export default {
  ...Theme,
  Layout: () => {
    return h(Theme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-hero-image': () => h(HeroLogo),
      // 'home-features-after': () => h(Playground),
    });
  },
  enhanceApp({ app, router, siteData }) {
    app.component('Icon', Icon);
    app.component('BlogListLayout', BlogListLayout);
    app.component('BlogPostMeta', BlogPostMeta);
    app.component('CodeSandbox', CodeSandbox);
  },
};

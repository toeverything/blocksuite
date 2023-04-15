// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import Theme from 'vitepress/theme';
import Logo from './logo.vue';
import './style.css';

export default {
  ...Theme,
  Layout: () => {
    return h(Theme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'home-hero-image': () => h(Logo),
    });
  },
  enhanceApp({ app, router, siteData }) {
    // ...
  },
};

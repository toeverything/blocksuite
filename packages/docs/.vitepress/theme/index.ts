// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import Theme from 'vitepress/theme';
// @ts-ignore
import Logo from './logo.vue';
// @ts-ignore
import MySandbox from '../../components/MySandbox.vue';
import 'vitepress-plugin-sandpack/dist/style.css';
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
    app.component('Sandbox', MySandbox);
    // ...
  },
};

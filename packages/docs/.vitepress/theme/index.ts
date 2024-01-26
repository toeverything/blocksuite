// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import Theme from 'vitepress/theme';
import Logo from './logo.vue';
import CodeSandbox from '../../components/code-sandbox.vue';
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
    app.component('CodeSandbox', CodeSandbox);
  },
};

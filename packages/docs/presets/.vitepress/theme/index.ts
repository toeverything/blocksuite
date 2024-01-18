// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import Theme from 'vitepress/theme';
// @ts-ignore
import CodeSandbox from '../../components/code-sandbox.vue';
import 'vitepress-plugin-sandpack/dist/style.css';
import './style.css';

export default {
  ...Theme,
  enhanceApp({ app, router, siteData }) {
    app.component('CodeSandbox', CodeSandbox);
  },
};

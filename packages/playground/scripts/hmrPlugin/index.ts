import path from 'node:path';
import { hmrPlugin, presets } from 'vite-plugin-web-components-hmr';

import { fineTuneHmr } from './fineTune';

const customLitPath = path.resolve(
  __dirname,
  '../../../blocks/src/__internal__/index.js'
);

const include = ['../blocks/src/**/*'];
const exclude = ['**/*/node_modules/**/*'];

// https://vitejs.dev/config/
export const hmrPlugins = process.env.WC_HMR
  ? [
      hmrPlugin({
        include,
        exclude,
        presets: [presets.lit],
        decorators: [{ name: 'customElement', import: 'lit/decorators.js' }],
        baseClasses: [
          {
            name: 'NonShadowLitElement',
            import: customLitPath,
          },
        ],
      }),
      fineTuneHmr({
        include,
        exclude,
      }),
    ]
  : [];

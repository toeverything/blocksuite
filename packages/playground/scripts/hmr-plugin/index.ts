import path from 'node:path';

import {
  hmrPlugin as wcHmrPlugin,
  presets,
} from 'vite-plugin-web-components-hmr';

import { fineTuneHmr } from './fine-tune.js';

const customLitPath = path.resolve(
  __dirname,
  '../../../blocks/src/_legacy/index.js'
);

const include = ['../blocks/src/**/*'];
const exclude = ['**/*/node_modules/**/*'];

// https://vitejs.dev/config/
export const hmrPlugin = process.env.WC_HMR
  ? [
      wcHmrPlugin({
        include,
        exclude,
        presets: [presets.lit],
        decorators: [{ name: 'customElement', import: 'lit/decorators.js' }],
        baseClasses: [
          {
            name: 'ShadowlessElement',
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

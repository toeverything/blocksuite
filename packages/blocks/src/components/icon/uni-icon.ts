import type { icons } from '@blocksuite/global/config';

import { map } from '../uni-component/operation.js';
import { createUniComponentFromWebComponent } from '../uni-component/uni-component.js';
import { AffineLitIcon } from './icon.js';

const litIcon = createUniComponentFromWebComponent<{ name: string }>(
  AffineLitIcon
);
export const createIcon = (name: keyof typeof icons) => {
  return map(litIcon, () => ({ name }));
};

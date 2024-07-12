import type * as icons from '../common/icons/index.js';

import { AffineLitIcon } from '../common/icons/icon.js';
import { map } from './uni-component/operation.js';
import { createUniComponentFromWebComponent } from './uni-component/uni-component.js';

const litIcon = createUniComponentFromWebComponent<{ name: string }>(
  AffineLitIcon
);
export const createIcon = (name: keyof typeof icons) => {
  return map(litIcon, () => ({ name }));
};

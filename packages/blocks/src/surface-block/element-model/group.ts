import type { Y } from '@blocksuite/store';

import type { BaseProps } from './base.js';
import { ElementModel } from './base.js';

type GroupElementProps = BaseProps & {
  children: Y.Map<boolean>;
  title: Y.Text;
};

export class GroupElementModel extends ElementModel<GroupElementProps> {
  get childrenIds() {
    return [...this.children.keys()];
  }

  get children() {
    return this.yMap.get('children') as GroupElementProps['children'];
  }

  get childrenElements() {
    const elements = [];
    const keys = this.children.keys();

    for (const key of keys) {
      const element =
        this.surfaceModel.getElementById(key) ||
        this.surfaceModel.page.getBlockById(key);

      element && elements.push(element);
    }

    return elements;
  }
}

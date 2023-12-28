import type { Y } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';

import { keys } from '../../_common/utils/iterable.js';
import type { BaseProps } from './base.js';
import { ElementModel } from './base.js';

type GroupElementProps = BaseProps & {
  children: Y.Map<boolean>;
  title: Y.Text;
};

export class GroupElementModel extends ElementModel<GroupElementProps> {
  static override default() {
    return {
      children: new Workspace.Y.Map(),
      title: new Workspace.Y.Text(),
    } as GroupElementProps;
  }

  static override propsToYStruct(props: GroupElementProps) {
    if (props.title && !(props.title instanceof Workspace.Y.Text)) {
      props.title = new Workspace.Y.Text(props.title);
    }

    if (props.children && !(props.children instanceof Workspace.Y.Map)) {
      const children = new Workspace.Y.Map() as Y.Map<boolean>;

      keys(props.children).forEach(key => {
        children.set(key as string, true);
      });

      props.children = children;
    }

    return props;
  }

  get type() {
    return 'group';
  }

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

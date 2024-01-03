import type { Y } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';

import { keys } from '../../_common/utils/iterable.js';
import { Bound } from '../utils/bound.js';
import { type SerializedXYWH } from '../utils/xywh.js';
import type { BaseProps } from './base.js';
import { ElementModel } from './base.js';
import { yfield } from './decorators.js';

type GroupElementProps = BaseProps & {
  children: Y.Map<boolean>;
  title: Y.Text;
};

export class GroupElementModel extends ElementModel<GroupElementProps> {
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

  @yfield()
  children: Y.Map<boolean> = new Workspace.Y.Map<boolean>();

  @yfield()
  title: Y.Text = new Workspace.Y.Text();

  get xywh() {
    const childrenIds = this.childrenIds;

    if (childrenIds.length === 0) return '[0,0,0,0]';

    const bound: Bound = childrenIds
      .map(
        id =>
          this.surfaceModel.getElementById(id) ??
          this.surfaceModel.page.getBlockById(id)
      )
      .filter(el => el)
      .reduce(
        (prev, ele) => {
          return prev.unite((ele as ElementModel).elementBound);
        },
        new Bound(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, 0, 0)
      );

    return bound.serialize();
  }

  set xywh(_: SerializedXYWH) {}

  get rotate() {
    return 0;
  }

  set rotate(_: number) {}

  get type() {
    return 'group';
  }

  get childrenIds() {
    return [...this.children.keys()];
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

import type { Y } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';

import { keys } from '../../_common/utils/iterable.js';
import type {
  EdgelessBlock,
  IEdgelessElement,
} from '../../page-block/edgeless/type.js';
import { Bound } from '../utils/bound.js';
import { type SerializedXYWH } from '../utils/xywh.js';
import type { BaseProps } from './base.js';
import { ElementModel } from './base.js';
import { local, yfield } from './decorators.js';

type GroupElementProps = BaseProps & {
  children: Y.Map<boolean>;
  title: Y.Text;
};

export class GroupElementModel extends ElementModel<GroupElementProps> {
  static override propsToY(props: GroupElementProps) {
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

  @local()
  showTitle: boolean = true;

  get xywh() {
    const childrenIds = this.childIds;

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

  override get connectable(): boolean {
    return false;
  }

  get type() {
    return 'group';
  }

  get childIds() {
    return [...this.children.keys()];
  }

  get childElements() {
    const elements = [];
    const keys = this.children.keys();

    for (const key of keys) {
      const element =
        this.surfaceModel.getElementById(key) ||
        (this.surfaceModel.page.getBlockById(key) as EdgelessBlock);

      element && elements.push(element);
    }

    return elements;
  }

  hasDescendant(element: string | IEdgelessElement) {
    const groups =
      typeof element === 'string'
        ? this.surfaceModel.getGroups(element)
        : this.surfaceModel.getGroups(element.id);

    return groups.some(group => group.id === this.id);
  }
}

import type { Y } from '@blocksuite/store';
import { Workspace } from '@blocksuite/store';

import { keys } from '../../_common/utils/iterable.js';
import type {
  EdgelessBlockModel,
  IEdgelessElement,
} from '../../root-block/edgeless/type.js';
import { Bound } from '../utils/bound.js';
import { linePolygonIntersects } from '../utils/math-utils.js';
import type { PointLocation } from '../utils/point-location.js';
import type { IVec2 } from '../utils/vec.js';
import { type SerializedXYWH } from '../utils/xywh.js';
import type { BaseProps } from './base.js';
import { ElementModel } from './base.js';
import { local, observe, yfield } from './decorators.js';

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

  @observe((_: Y.YMapEvent<unknown>, instance: GroupElementModel) => {
    instance.childIds = Array.from(instance.children.keys());
  })
  @yfield()
  children: Y.Map<boolean> = new Workspace.Y.Map<boolean>();

  @yfield()
  title: Y.Text = new Workspace.Y.Text();

  @local()
  showTitle: boolean = true;

  get xywh() {
    const childElements = this.childElements;

    if (childElements.length === 0) return '[0,0,0,0]';

    const bound: Bound = childElements.slice(1).reduce((prev, ele) => {
      return prev.unite((ele as ElementModel).elementBound);
    }, childElements[0].elementBound);

    return bound.serialize();
  }

  set xywh(_: SerializedXYWH) {}

  get rotate() {
    return 0;
  }

  set rotate(_: number) {}

  override get connectable() {
    return false;
  }

  get type() {
    return 'group';
  }

  @local()
  childIds: string[] = [];

  get childElements() {
    const elements = [];
    const keys = this.children.keys();

    for (const key of keys) {
      const element =
        this.surface.getElementById(key) ||
        (this.surface.doc.getBlockById(key) as EdgelessBlockModel);

      element && elements.push(element);
    }

    return elements;
  }

  hasDescendant(element: string | IEdgelessElement) {
    const groups =
      typeof element === 'string'
        ? this.surface.getGroups(element)
        : this.surface.getGroups(element.id);

    return groups.some(group => group.id === this.id);
  }

  addChild(element: IEdgelessElement | string) {
    const id = typeof element === 'string' ? element : element.id;

    this.surface.doc.transact(() => {
      this.children.set(id, true);
    });
  }

  removeChild(element: IEdgelessElement | string) {
    const id = typeof element === 'string' ? element : element.id;

    this.surface.doc.transact(() => {
      this.children.delete(id);
    });
  }

  /**
   * Get all decendants of this group
   * @param withoutGroup if true, will not include group element
   */
  decendants(withoutGroup = true) {
    return this.childElements.reduce(
      (prev, child) => {
        if (child instanceof GroupElementModel) {
          prev = prev.concat(child.decendants());

          !withoutGroup && prev.push(child);
        } else {
          prev.push(child);
        }

        return prev;
      },
      [] as GroupElementModel['childElements']
    );
  }

  override containedByBounds(bound: Bound): boolean {
    return bound.contains(Bound.deserialize(this.xywh));
  }

  override intersectWithLine(start: IVec2, end: IVec2): PointLocation[] | null {
    const bound = Bound.deserialize(this.xywh);
    return linePolygonIntersects(start, end, bound.points);
  }
}

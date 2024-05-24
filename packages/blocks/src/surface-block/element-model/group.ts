import type { Y } from '@blocksuite/store';
import { DocCollection } from '@blocksuite/store';

import { keys } from '../../_common/utils/iterable.js';
import type { EdgelessModel } from '../../root-block/edgeless/type.js';
import { Bound } from '../utils/bound.js';
import { linePolygonIntersects } from '../utils/math-utils.js';
import type { PointLocation } from '../utils/point-location.js';
import type { IVec2 } from '../utils/vec.js';
import type { BaseProps } from './base.js';
import { GroupLikeModel } from './base.js';
import { local, observe, yfield } from './decorators.js';

type GroupElementProps = BaseProps & {
  children: Y.Map<boolean>;
  title: Y.Text;
};

export class GroupElementModel extends GroupLikeModel<GroupElementProps> {
  static override propsToY(props: GroupElementProps) {
    if (props.title && !(props.title instanceof DocCollection.Y.Text)) {
      props.title = new DocCollection.Y.Text(props.title);
    }

    if (props.children && !(props.children instanceof DocCollection.Y.Map)) {
      const children = new DocCollection.Y.Map() as Y.Map<boolean>;

      keys(props.children).forEach(key => {
        children.set(key as string, true);
      });

      props.children = children;
    }

    return props;
  }

  @observe((_, instance: GroupElementModel, transaction) => {
    instance.setChildIds(
      Array.from(instance.children.keys()),
      transaction?.local ?? false
    );
  })
  @yfield()
  accessor children: Y.Map<boolean> = new DocCollection.Y.Map<boolean>();

  @yfield()
  accessor title: Y.Text = new DocCollection.Y.Text();

  @local()
  accessor showTitle: boolean = true;

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

  addChild(element: EdgelessModel | string) {
    const id = typeof element === 'string' ? element : element.id;

    this.surface.doc.transact(() => {
      this.children.set(id, true);
    });
  }

  removeDescendant(element: EdgelessModel | string) {
    const id = typeof element === 'string' ? element : element.id;

    this.surface.doc.transact(() => {
      this.children.delete(id);
    });
  }

  override containedByBounds(bound: Bound): boolean {
    return bound.contains(Bound.deserialize(this.xywh));
  }

  override intersectWithLine(start: IVec2, end: IVec2): PointLocation[] | null {
    const bound = Bound.deserialize(this.xywh);
    return linePolygonIntersects(start, end, bound.points);
  }
}

import type { Y } from '@blocksuite/store';
import { DocCollection } from '@blocksuite/store';

import { keys } from '../../_common/utils/iterable.js';
import { Bound } from '../utils/bound.js';
import { linePolygonIntersects } from '../utils/math-utils.js';
import type { PointLocation } from '../utils/point-location.js';
import type { IVec2 } from '../utils/vec.js';
import type { IBaseProps, SerializedElement } from './base.js';
import { SurfaceGroupLikeModel } from './base.js';
import { local, observe, yfield } from './decorators.js';

type GroupElementProps = IBaseProps & {
  children: Y.Map<boolean>;
  title: Y.Text;
};

export type SerializedGroupElement = SerializedElement & {
  title: string;
  children: Record<string, boolean>;
};

export class GroupElementModel extends SurfaceGroupLikeModel<GroupElementProps> {
  get rotate() {
    return 0;
  }

  set rotate(_: number) {}

  get type() {
    return 'group';
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

  override serialize() {
    const result = super.serialize();
    return result as SerializedGroupElement;
  }

  addChild(element: BlockSuite.EdgelessModelType | string) {
    const id = typeof element === 'string' ? element : element.id;
    if (!this.children) {
      return;
    }
    this.surface.doc.transact(() => {
      this.children.set(id, true);
    });
  }

  removeChild(element: BlockSuite.EdgelessModelType | string) {
    const id = typeof element === 'string' ? element : element.id;
    if (!this.children) {
      return;
    }
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

  static override propsToY(props: Record<string, unknown>) {
    if (props.title && !(props.title instanceof DocCollection.Y.Text)) {
      props.title = new DocCollection.Y.Text(props.title as string);
    }

    if (props.children && !(props.children instanceof DocCollection.Y.Map)) {
      const children = new DocCollection.Y.Map() as Y.Map<boolean>;

      keys(props.children).forEach(key => {
        children.set(key as string, true);
      });

      props.children = children;
    }

    return props as GroupElementProps;
  }
}

declare global {
  namespace BlockSuite {
    interface SurfaceGroupLikeModelMap {
      group: GroupElementModel;
    }
  }
}

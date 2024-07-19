import type { Y } from '@blocksuite/store';

import { DocCollection } from '@blocksuite/store';

import type { PointLocation } from '../utils/point-location.js';
import type { IVec } from '../utils/vec.js';
import type { IBaseProps, SerializedElement } from './base.js';

import { keys } from '../../_common/utils/iterable.js';
import { Bound } from '../utils/bound.js';
import { linePolygonIntersects } from '../utils/math-utils.js';
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

  addChild(element: BlockSuite.EdgelessModelType | string) {
    const id = typeof element === 'string' ? element : element.id;
    if (!this.children) {
      return;
    }
    this.surface.doc.transact(() => {
      this.children.set(id, true);
    });
  }

  override containedByBounds(bound: Bound): boolean {
    return bound.contains(Bound.deserialize(this.xywh));
  }

  override intersectWithLine(start: IVec, end: IVec): PointLocation[] | null {
    const bound = Bound.deserialize(this.xywh);
    return linePolygonIntersects(start, end, bound.points);
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

  override serialize() {
    const result = super.serialize();
    return result as SerializedGroupElement;
  }

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

  @local()
  accessor showTitle: boolean = true;

  @yfield()
  accessor title: Y.Text = new DocCollection.Y.Text();
}

declare global {
  namespace BlockSuite {
    interface SurfaceGroupLikeModelMap {
      group: GroupElementModel;
    }
  }
}

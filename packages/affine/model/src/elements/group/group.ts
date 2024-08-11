import type {
  BaseElementProps,
  SerializedElement,
} from '@blocksuite/block-std/gfx';
import type { Y } from '@blocksuite/store';

import {
  GfxGroupLikeElementModel,
  local,
  observe,
  yfield,
} from '@blocksuite/block-std/gfx';
import {
  Bound,
  type IVec,
  type PointLocation,
  keys,
  linePolygonIntersects,
} from '@blocksuite/global/utils';
import { DocCollection } from '@blocksuite/store';

type GroupElementProps = BaseElementProps & {
  children: Y.Map<boolean>;
  title: Y.Text;
};

export type SerializedGroupElement = SerializedElement & {
  title: string;
  children: Record<string, boolean>;
};

export class GroupElementModel extends GfxGroupLikeElementModel<GroupElementProps> {
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

  addChild(element: BlockSuite.EdgelessModel | string) {
    const id = typeof element === 'string' ? element : element.id;
    if (!this.children) {
      return;
    }
    this.surface.doc.transact(() => {
      this.children.set(id, true);
    });
  }

  override containsBound(bound: Bound): boolean {
    return bound.contains(Bound.deserialize(this.xywh));
  }

  override getLineIntersections(
    start: IVec,
    end: IVec
  ): PointLocation[] | null {
    const bound = Bound.deserialize(this.xywh);
    return linePolygonIntersects(start, end, bound.points);
  }

  removeChild(element: BlockSuite.EdgelessModel | string) {
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

  @observe(
    // use `GroupElementModel` type in decorator will cause playwright error
    (_, instance: GfxGroupLikeElementModel<GroupElementProps>, transaction) => {
      instance.setChildIds(
        Array.from(instance.children.keys()),
        transaction?.local ?? false
      );
    }
  )
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

    interface SurfaceElementModelMap {
      group: GroupElementModel;
    }
  }
}

// https://github.com/tldraw/tldraw/blob/24cad6959f59f93e20e556d018c391fd89d4ecca/packages/tldraw/src/state/shapes/shared/shape-styles.ts
import { BaseBlockModel, Page } from '@blocksuite/store';
import { ColorStyle, TDShapeType } from '../__internal__/utils/shape.js';
import { literal } from 'lit/static-html.js';

export class ShapeBlockModel
  extends BaseBlockModel
  implements BlockSuiteProps.ShapeBlockModel
{
  static version = 1;
  // FIXME
  // @ts-ignore
  flavour = 'affine:shape' as const;
  tag = literal`affine-shape`;

  color: ColorStyle | `#${string}`;
  type: TDShapeType;
  xywh: string;

  constructor(
    page: Page,
    props: PropsWithId<Partial<BlockSuiteProps.ShapeBlockModel>>
  ) {
    super(page, props);
    this.xywh = props.xywh ?? '[0,0,100,100]';
    this.type = props.type ?? TDShapeType.Rectangle;
    this.color = props.color ?? ColorStyle.Black;
  }
}

import { assertExists } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import { DEFAULT_EDGELESS_PROP } from '../../../../_common/edgeless/note/consts.js';
import type { NoteBlockModel } from '../../../../models.js';
import {
  CanvasTextFontFamily,
  CanvasTextFontStyle,
  CanvasTextFontWeight,
} from '../../../../surface-block/consts.js';
import {
  Bound,
  type Connection,
  GroupElement,
  normalizeDegAngle,
  type Options,
  Overlay,
  PhasorElementType,
  type RoughCanvas,
  ShapeElement,
  type ShapeStyle,
  type ShapeType,
  type XYWH,
} from '../../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../../edgeless-page-block.js';
import { getGridBound } from '../../utils/bound-utils.js';
import { type Shape, ShapeFactory } from '../../utils/tool-overlay.js';
import { GET_DEFAULT_TEXT_COLOR } from '../panel/color-panel.js';

export enum Direction {
  Right,
  Bottom,
  Left,
  Top,
}

export const PANEL_OFFSET = {
  x: 100,
  y: -160,
};
export const MAIN_GAP = 100;
export const SECOND_GAP = 20;
export const DEFAULT_NOTE_OVERLAY_HEIGHT = 110;
export const DEFAULT_TEXT_WIDTH = 116;
export const DEFAULT_TEXT_HEIGHT = 24;

export type TARGET_SHAPE_TYPE = ShapeType | 'roundedRect';
export type AUTO_COMPLETE_TARGET_TYPE =
  | TARGET_SHAPE_TYPE
  | 'text'
  | 'note'
  | 'frame';

export const DEFAULT_NOTE_BACKGROUND_COLOR =
  '--affine-background-secondary-color';
export const NOTE_BACKGROUND_COLOR_MAP = new Map(
  Object.entries({
    '--affine-palette-shape-yellow': '--affine-tag-yellow',
    '--affine-palette-shape-red': '--affine-tag-red',
    '--affine-palette-shape-green': '--affine-tag-green',
    '--affine-palette-shape-blue': '--affine-tag-blue',
    '--affine-palette-shape-purple': '--affine-tag-purple',
  })
);

class AutoCompleteTargetOverlay extends Overlay {
  xywh: XYWH;
  constructor(xywh: XYWH) {
    super();
    this.xywh = xywh;
  }

  override render(_ctx: CanvasRenderingContext2D, _rc: RoughCanvas) {}
}

export class AutoCompleteTextOverlay extends AutoCompleteTargetOverlay {
  constructor(xywh: XYWH) {
    super(xywh);
  }

  override render(ctx: CanvasRenderingContext2D, _rc: RoughCanvas) {
    ctx.globalAlpha = 0.4;
    const [x, y, w, h] = this.xywh;
    ctx.strokeStyle = '#1e96eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // fill text placeholder
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#C0BFC1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText("Type '/' to insert", x + w / 2, y + h / 2);
  }
}

export class AutoCompleteNoteOverlay extends AutoCompleteTargetOverlay {
  private _background: string;
  constructor(xywh: XYWH, background: string) {
    super(xywh);
    this._background = background;
  }

  override render(ctx: CanvasRenderingContext2D, _rc: RoughCanvas) {
    ctx.globalAlpha = 0.4;
    const [x, y, w, h] = this.xywh;
    ctx.fillStyle = this._background;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.10)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // fill text placeholder
    ctx.font = '15px sans-serif';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText("Type '/' for command", x + 24, y + h / 2);
  }
}

export class AutoCompleteFrameOverlay extends AutoCompleteTargetOverlay {
  private _strokeColor;
  constructor(xywh: XYWH, strokeColor: string) {
    super(xywh);
    this._strokeColor = strokeColor;
  }

  override render(ctx: CanvasRenderingContext2D, _rc: RoughCanvas) {
    ctx.globalAlpha = 0.4;
    const [x, y, w, h] = this.xywh;
    // frame title background
    const titleWidth = 72;
    const titleHeight = 30;
    const titleY = y - titleHeight - 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(x, titleY, titleWidth, titleHeight, 4);
    ctx.closePath();
    ctx.fill();

    // fill title text
    ctx.globalAlpha = 1;
    ctx.font = '14px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Frame', x + titleWidth / 2, titleY + titleHeight / 2);

    // frame stroke
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = this._strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.closePath();
    ctx.stroke();
  }
}

export class AutoCompleteShapeOverlay extends Overlay {
  private _shape: Shape;
  constructor(
    xywh: XYWH,
    type: TARGET_SHAPE_TYPE,
    options: Options,
    shapeStyle: ShapeStyle
  ) {
    super();
    this._shape = ShapeFactory.createShape(xywh, type, options, shapeStyle);
  }

  override render(ctx: CanvasRenderingContext2D, rc: RoughCanvas) {
    ctx.globalAlpha = 0.4;
    this._shape.draw(ctx, rc);
  }
}

export function nextBound(
  type: Direction,
  curShape: ShapeElement,
  elements: ShapeElement[]
) {
  const bound = Bound.deserialize(curShape.xywh);
  const { x, y, w, h } = bound;
  let nextBound: Bound;
  let angle = 0;
  switch (type) {
    case Direction.Right:
      angle = 0;
      break;
    case Direction.Bottom:
      angle = 90;
      break;
    case Direction.Left:
      angle = 180;
      break;
    case Direction.Top:
      angle = 270;
      break;
  }
  angle = normalizeDegAngle(angle + curShape.rotate);

  if (angle >= 45 && angle <= 135) {
    nextBound = new Bound(x, y + h + MAIN_GAP, w, h);
  } else if (angle >= 135 && angle <= 225) {
    nextBound = new Bound(x - w - MAIN_GAP, y, w, h);
  } else if (angle >= 225 && angle <= 315) {
    nextBound = new Bound(x, y - h - MAIN_GAP, w, h);
  } else {
    nextBound = new Bound(x + w + MAIN_GAP, y, w, h);
  }

  function isValidBound(bound: Bound) {
    return !elements.some(e => bound.isOverlapWithBound(getGridBound(e)));
  }

  let count = 0;
  function findValidBound() {
    count++;
    const number = Math.ceil(count / 2);
    const next = nextBound.clone();
    switch (type) {
      case Direction.Right:
      case Direction.Left:
        next.y =
          count % 2 === 1
            ? nextBound.y - (h + SECOND_GAP) * number
            : nextBound.y + (h + SECOND_GAP) * number;
        break;
      case Direction.Bottom:
      case Direction.Top:
        next.x =
          count % 2 === 1
            ? nextBound.x - (w + SECOND_GAP) * number
            : nextBound.x + (w + SECOND_GAP) * number;
        break;
    }
    if (isValidBound(next)) return next;
    return findValidBound();
  }

  return isValidBound(nextBound) ? nextBound : findValidBound();
}

export function getPosition(type: Direction) {
  let startPosition: Connection['position'] = [],
    endPosition: Connection['position'] = [];
  switch (type) {
    case Direction.Right:
      startPosition = [1, 0.5];
      endPosition = [0, 0.5];
      break;
    case Direction.Bottom:
      startPosition = [0.5, 1];
      endPosition = [0.5, 0];
      break;
    case Direction.Left:
      startPosition = [0, 0.5];
      endPosition = [1, 0.5];
      break;
    case Direction.Top:
      startPosition = [0.5, 0];
      endPosition = [0.5, 1];
      break;
  }
  return { startPosition, endPosition };
}

export function isShape(
  element: ShapeElement | NoteBlockModel
): element is ShapeElement {
  return element instanceof ShapeElement;
}

export function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function createEdgelessElement(
  edgeless: EdgelessPageBlockComponent,
  current: ShapeElement | NoteBlockModel,
  bound: Bound
) {
  let id;
  const { surface } = edgeless;
  if (isShape(current)) {
    id = edgeless.surface.addElement(current.type, {
      ...current.serialize(),
      text: new Workspace.Y.Text(),
      xywh: bound.serialize(),
    });
  } else {
    const { page } = edgeless;
    id = page.addBlock(
      'affine:note',
      {
        background: current.background,
        hidden: current.hidden,
        edgeless: current.edgeless,
        xywh: bound.serialize(),
      },
      edgeless.model.id
    );
    const note = page.getBlockById(id) as NoteBlockModel;
    assertExists(note);
    if (!note.edgeless) {
      note.edgeless = DEFAULT_EDGELESS_PROP;
    }
    note.edgeless.collapse = true;
    page.addBlock('affine:paragraph', {}, note.id);
  }
  const group = surface.getGroupParent(current);
  if (group instanceof GroupElement) {
    surface.group.addChild(group, id);
  }
  return id;
}

export async function createShapeElement(
  edgeless: EdgelessPageBlockComponent,
  current: ShapeElement,
  targetType: TARGET_SHAPE_TYPE
) {
  const { surface } = edgeless;
  const id = edgeless.surface.addElement(current.type, {
    ...current.serialize(),
    shapeType: targetType === 'roundedRect' ? 'rect' : targetType,
    radius: targetType === 'roundedRect' ? 0.1 : 0,
    text: new Workspace.Y.Text(),
  });
  const group = surface.getGroupParent(current);
  if (group instanceof GroupElement) {
    surface.group.addChild(group, id);
  }
  return id;
}

export async function createTextElement(
  edgeless: EdgelessPageBlockComponent,
  current: ShapeElement
) {
  const { surface } = edgeless;
  const id = edgeless.surface.addElement(PhasorElementType.TEXT, {
    text: new Workspace.Y.Text(),
    textAlign: 'left',
    fontSize: 24,
    fontFamily: CanvasTextFontFamily.Inter,
    color: GET_DEFAULT_TEXT_COLOR(),
    fontWeight: CanvasTextFontWeight.Regular,
    fontStyle: CanvasTextFontStyle.Normal,
  });
  const group = surface.getGroupParent(current);
  if (group instanceof GroupElement) {
    surface.group.addChild(group, id);
  }
  return id;
}

import { assertExists } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import { getBlockClipboardInfo } from '../../../../_legacy/clipboard/index.js';
import type { NoteBlockModel } from '../../../../models.js';
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

export const MAIN_GAP = 100;
export const SECOND_GAP = 20;

export type TARGET_SHAPE_TYPE = ShapeType | 'roundedRect';

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

export async function createEdgelessElement(
  edgeless: EdgelessPageBlockComponent,
  current: ShapeElement | NoteBlockModel
) {
  let id;
  const { surface } = edgeless;
  if (isShape(current)) {
    id = edgeless.surface.addElement(current.type, {
      ...current.serialize(),
      text: new Workspace.Y.Text(),
    });
  } else {
    const { page } = edgeless;
    id = page.addBlock(
      'affine:note',
      { background: current.background },
      edgeless.model.id
    );
    const noteService = edgeless.getService('affine:note');
    const note = page.getBlockById(id) as NoteBlockModel;
    assertExists(note);
    const serializedBlock = (await getBlockClipboardInfo(current)).json;
    await noteService.json2Block(note, serializedBlock.children);
  }
  const group = surface.pickById(surface.getGroupParent(current));
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
  const group = surface.pickById(surface.getGroupParent(current));
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
    color: GET_DEFAULT_TEXT_COLOR(),
    bold: false,
    italic: false,
  });
  const group = surface.pickById(surface.getGroupParent(current));
  if (group instanceof GroupElement) {
    surface.group.addChild(group, id);
  }
  return id;
}

/* eslint-disable @typescript-eslint/no-restricted-imports */
import '../declare-test-window.js';

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { Bound } from 'utils/asserts.js';

import {
  type CssVariableName,
  type IPoint,
  type NoteBlockModel,
} from '../../../packages/blocks/src/index.js';
import { assertExists, sleep } from '../../../packages/global/src/utils.js';
import { clickView } from './click.js';
import { dragBetweenCoords } from './drag.js';
import {
  pressBackspace,
  pressEnter,
  selectAllByKeyboard,
  SHIFT_KEY,
  SHORT_KEY,
  type,
} from './keyboard.js';
import {
  enterPlaygroundRoom,
  getEditorLocator,
  initEmptyEdgelessState,
  waitNextFrame,
} from './misc.js';

const rotWith = (A: number[], C: number[], r = 0): number[] => {
  if (r === 0) return A;

  const s = Math.sin(r);
  const c = Math.cos(r);

  const px = A[0] - C[0];
  const py = A[1] - C[1];

  const nx = px * c - py * s;
  const ny = px * s + py * c;

  return [nx + C[0], ny + C[1]];
};

const AWAIT_TIMEOUT = 500;
export const ZOOM_BAR_RESPONSIVE_SCREEN_WIDTH = 1200;
export type Point = { x: number; y: number };
export enum Shape {
  Square = 'Square',
  Ellipse = 'Ellipse',
  Diamond = 'Diamond',
  Triangle = 'Triangle',
  'Rounded rectangle' = 'Rounded rectangle',
}

export async function getNoteRect(
  page: Page,
  ids: { pageId: string; noteId: string; paragraphId: string }
) {
  const xywh: string | null = await page.evaluate(
    ([id]) => {
      const page = window.workspace.getPage('page:home');
      const block = page?.getBlockById(id.noteId);
      if (block?.flavour === 'affine:note') {
        return (block as NoteBlockModel).xywh;
      } else {
        return null;
      }
    },
    [ids] as const
  );
  expect(xywh).not.toBeNull();
  const [x, y, w, h] = JSON.parse(xywh as string);
  return { x, y, w, h };
}

export async function getNoteProps(page: Page, noteId: string) {
  const props = await page.evaluate(
    ([id]) => {
      const page = window.workspace.getPage('page:home');
      const block = page?.getBlockById(id);
      if (block?.flavour === 'affine:note') {
        return (block as NoteBlockModel).keys.reduce(
          (pre, key) => {
            pre[key] = block[key as keyof typeof block] as string;
            return pre;
          },
          {} as Record<string, string | number>
        );
      } else {
        return null;
      }
    },
    [noteId] as const
  );
  return props;
}

export async function registerFormatBarCustomElements(page: Page) {
  await page.click('sl-button[content="Register FormatBar Custom Elements"]');
}

export async function switchEditorMode(page: Page) {
  await page.click('sl-button[content="Switch Editor Mode"]');
  // FIXME: listen to editor loaded event
  await waitNextFrame(page);
}

export async function switchEditorEmbedMode(page: Page) {
  await page.click('sl-button[content="Add container offset"]');
}

type BasicEdgelessTool = 'default' | 'pan' | 'note';
type SpecialEdgelessTool =
  | 'shape'
  | 'brush'
  | 'eraser'
  | 'text'
  | 'connector'
  | 'frame';

type EdgelessTool = BasicEdgelessTool | SpecialEdgelessTool;
type ZoomToolType = 'zoomIn' | 'zoomOut' | 'fitToScreen';
type ComponentToolType = 'shape' | 'thin' | 'thick' | 'brush' | 'more';

export function locatorEdgelessToolButton(
  page: Page,
  type: EdgelessTool,
  innerContainer = true
) {
  const selector = {
    default: '.edgeless-default-button',
    pan: '.edgeless-default-button',
    shape: '.edgeless-shape-button',
    brush: '.edgeless-brush-button',
    eraser: '.edgeless-eraser-button',
    text: '.edgeless-text-button',
    connector: '.edgeless-connector-button',
    note: '.edgeless-note-button',
    frame: '.edgeless-frame-button',
  }[type];

  let buttonType;
  switch (type) {
    case 'brush':
    case 'text':
    case 'eraser':
    case 'shape':
      buttonType = 'edgeless-toolbar-button';
      break;
    default:
      buttonType = 'edgeless-tool-icon-button';
  }
  const button = page.locator(`edgeless-toolbar ${buttonType}${selector}`);

  return innerContainer ? button.locator('.icon-container') : button;
}

export async function toggleZoomBarWhenSmallScreenWidth(page: Page) {
  const toggleZoomBarButton = page.locator(
    '.toggle-button edgeless-tool-icon-button.non-actived'
  );
  const isClosed = (await toggleZoomBarButton.count()) === 1;
  if (isClosed) {
    await toggleZoomBarButton.click();
    await page.waitForTimeout(200);
  }
}

export async function locatorEdgelessZoomToolButton(
  page: Page,
  type: ZoomToolType,
  innerContainer = true
) {
  const text = {
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    fitToScreen: 'Fit to screen',
  }[type];

  const screenWidth = page.viewportSize()?.width;
  assertExists(screenWidth);
  let zoomBarClass = 'horizontal';
  if (screenWidth < ZOOM_BAR_RESPONSIVE_SCREEN_WIDTH) {
    await toggleZoomBarWhenSmallScreenWidth(page);
    zoomBarClass = 'vertical';
  }

  const button = page
    .locator(
      `.edgeless-zoom-toolbar-container.${zoomBarClass} edgeless-tool-icon-button`
    )
    .filter({
      hasText: text,
    });

  return innerContainer ? button.locator('.icon-container') : button;
}

export function locatorEdgelessComponentToolButton(
  page: Page,
  type: ComponentToolType,
  innerContainer = true
) {
  const text = {
    shape: 'Shape',
    brush: 'Color',
    thin: 'Thin',
    thick: 'Thick',
    more: 'More',
  }[type];
  const button = page
    .locator('edgeless-component-toolbar edgeless-tool-icon-button')
    .filter({
      hasText: text,
    });

  return innerContainer ? button.locator('.icon-container') : button;
}

export async function setEdgelessTool(
  page: Page,
  mode: EdgelessTool,
  shape = Shape.Square
) {
  switch (mode) {
    case 'default': {
      const button = locatorEdgelessToolButton(page, 'default', false);
      const classes = (await button.getAttribute('class'))?.split(' ');
      if (!classes?.includes('default')) {
        await button.click();
        await sleep(100);
      }
      break;
    }
    case 'pan': {
      const button = locatorEdgelessToolButton(page, 'default', false);
      const classes = (await button.getAttribute('class'))?.split(' ');
      if (classes?.includes('default')) {
        await button.click();
        await sleep(100);
      } else if (classes?.includes('pan')) {
        await button.click(); // change to default
        await sleep(100);
        await button.click(); // change to pan
        await sleep(100);
      }
      break;
    }
    case 'brush':
    case 'text':
    case 'note':
    case 'eraser':
    case 'frame':
    case 'connector': {
      const button = locatorEdgelessToolButton(page, mode, false);
      await button.click();
      break;
    }
    case 'shape': {
      const shapeToolButton = locatorEdgelessToolButton(page, 'shape', false);
      await shapeToolButton.click();

      const squareShapeButton = page
        .locator('edgeless-tool-icon-button')
        .filter({ hasText: shape });
      await squareShapeButton.click();
      break;
    }
  }
}

export async function assertEdgelessTool(page: Page, mode: EdgelessTool) {
  const type = await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) {
      throw new Error('Missing edgeless page');
    }
    return container.edgelessTool.type;
  });
  expect(type).toEqual(mode);
}

export async function getEdgelessHoverRect(page: Page) {
  const hoverRect = page.locator('.affine-edgeless-hover-rect');
  const box = await hoverRect.boundingBox();
  if (!box) throw new Error('Missing edgeless hover rect');
  return box;
}

export async function getEdgelessBlockChild(page: Page) {
  const block = page.locator('.edgeless-block-portal-note');
  const blockBox = await block.boundingBox();
  if (blockBox === null) throw new Error('Missing edgeless block child rect');
  return blockBox;
}

export async function getEdgelessSelectedRect(page: Page) {
  const selectedBox = await page.evaluate(() => {
    const selected = document
      .querySelector('edgeless-selected-rect')
      ?.shadowRoot?.querySelector('.affine-edgeless-selected-rect');
    if (!selected) {
      throw new Error('Missing edgeless selected rect');
    }
    return selected.getBoundingClientRect();
  });
  return selectedBox;
}

export async function getEdgelessSelectedRectModel(page: Page): Promise<Bound> {
  return await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    const bound = container.selectionManager.selectedBound;
    return [bound.x, bound.y, bound.w, bound.h];
  });
}

export async function decreaseZoomLevel(page: Page) {
  const btn = await locatorEdgelessZoomToolButton(page, 'zoomOut', false);
  await btn.click();
  await sleep(AWAIT_TIMEOUT);
}

export async function increaseZoomLevel(page: Page) {
  const btn = await locatorEdgelessZoomToolButton(page, 'zoomIn', false);
  await btn.click();
  await sleep(AWAIT_TIMEOUT);
}

export async function autoFit(page: Page) {
  const btn = await locatorEdgelessZoomToolButton(page, 'fitToScreen', false);
  await btn.click();
  await sleep(AWAIT_TIMEOUT);
}

export async function addBasicBrushElement(
  page: Page,
  start: Point,
  end: Point,
  auto = true
) {
  await setEdgelessTool(page, 'brush');
  await dragBetweenCoords(page, start, end, { steps: 100 });
  auto && (await setEdgelessTool(page, 'default'));
}

export async function addBasicRectShapeElement(
  page: Page,
  start: Point,
  end: Point
) {
  await setEdgelessTool(page, 'shape');
  await dragBetweenCoords(page, start, end, { steps: 50 });
}

export async function addBasicShapeElement(
  page: Page,
  start: Point,
  end: Point,
  shape: Shape
) {
  await setEdgelessTool(page, 'shape', shape);
  await dragBetweenCoords(page, start, end, { steps: 50 });
}

export async function addBasicConnectorElement(
  page: Page,
  start: Point,
  end: Point
) {
  await setEdgelessTool(page, 'connector');
  await dragBetweenCoords(page, start, end, { steps: 100 });
}

export async function addNote(page: Page, text: string, x: number, y: number) {
  await setEdgelessTool(page, 'note');
  await page.mouse.click(x, y);
  await waitNextFrame(page);

  const paragraphs = text.split('\n');
  let i = 0;
  for (const paragraph of paragraphs) {
    ++i;
    await type(page, paragraph, 20);

    if (i < paragraphs.length) {
      await pressEnter(page);
    }
  }

  const { id } = await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');

    return {
      id: container.selectionManager.state.elements[0],
    };
  });

  return id;
}

export async function exitEditing(page: Page) {
  await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');

    container.selectionManager.setSelection({
      elements: [],
      editing: false,
    });
  });
}

export async function resizeElementByHandle(
  page: Page,
  delta: Point,
  corner:
    | 'top-left'
    | 'top-right'
    | 'bottom-right'
    | 'bottom-left' = 'top-left',
  steps = 1
) {
  const handle = page.locator(`.handle[aria-label="${corner}"] .resize`);
  const box = await handle.boundingBox();
  if (box === null) throw new Error();
  const offset = 5;
  await dragBetweenCoords(
    page,
    { x: box.x + offset, y: box.y + offset },
    { x: box.x + delta.x + offset, y: box.y + delta.y + offset },
    {
      steps,
    }
  );
}

export async function rotateElementByHandle(
  page: Page,
  deg = 0,
  corner:
    | 'top-left'
    | 'top-right'
    | 'bottom-right'
    | 'bottom-left' = 'top-left',
  steps = 1
) {
  const rect = await page
    .locator('.affine-edgeless-selected-rect')
    .boundingBox();
  if (rect === null) throw new Error();
  const box = await page
    .locator(`.handle[aria-label="${corner}"] .rotate`)
    .boundingBox();
  if (box === null) throw new Error();

  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  const t = rotWith([x, y], [cx, cy], (deg * Math.PI) / 180);

  await dragBetweenCoords(
    page,
    { x, y },
    { x: t[0], y: t[1] },
    {
      steps,
    }
  );
}

export async function selectBrushColor(page: Page, color: CssVariableName) {
  const colorButton = page.locator(
    `edgeless-brush-menu .color-unit[aria-label="${color.toLowerCase()}"]`
  );
  await colorButton.click();
}

export async function selectBrushSize(page: Page, size: string) {
  const sizeIndexMap: { [key: string]: number } = {
    two: 6,
    four: 5,
    six: 4,
    eight: 3,
    ten: 2,
    twelve: 1,
  };
  const sizeButton = page.locator(
    `edgeless-brush-menu .line-width-panel .line-width-button:nth-child(${sizeIndexMap[size]})`
  );
  await sizeButton.click();
}

export async function pickColorAtPoints(page: Page, points: number[][]) {
  const pickedColors: `#${string}`[] = await page.evaluate(points => {
    const node = document.querySelector(
      '.affine-edgeless-surface-block-container canvas'
    ) as HTMLCanvasElement;
    const w = node.width;
    const h = node.height;
    const ctx = node?.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    const pixelData = ctx.getImageData(0, 0, w, h).data;

    const colors = points.map(([x, y]) => {
      const startPosition = (y * w + x) * 4;
      return ('#' +
        (
          (1 << 24) +
          (pixelData[startPosition] << 16) +
          (pixelData[startPosition + 1] << 8) +
          pixelData[startPosition + 2]
        )
          .toString(16)
          .slice(1)) as `#${string}`;
    });
    return colors;
  }, points);
  return pickedColors;
}

export async function getNoteBoundBoxInEdgeless(page: Page, noteId: string) {
  const editor = getEditorLocator(page);
  const note = editor.locator(`affine-note[data-block-id="${noteId}"]`);
  const bound = await note.boundingBox();
  if (!bound) {
    throw new Error(`Missing note: ${noteId}`);
  }
  return bound;
}

export async function getAllNoteIds(page: Page) {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll('affine-note')).map(
      note => note.model.id
    );
  });
}

export async function countBlock(page: Page, flavour: string) {
  return await page.evaluate(
    ([flavour]) => {
      return Array.from(document.querySelectorAll(flavour)).length;
    },
    [flavour]
  );
}

export async function activeNoteInEdgeless(page: Page, noteId: string) {
  const bound = await getNoteBoundBoxInEdgeless(page, noteId);
  await page.mouse.dblclick(
    bound.x + bound.width / 2,
    bound.y + bound.height / 2
  );
}

export async function selectNoteInEdgeless(page: Page, noteId: string) {
  const bound = await getNoteBoundBoxInEdgeless(page, noteId);
  await page.mouse.click(bound.x, bound.y);
}

export async function updateExistedBrushElementSize(
  page: Page,
  nthSizeButton: 1 | 2 | 3 | 4 | 5 | 6
) {
  // get the nth brush size button
  const btn = page.locator(
    `.line-width-panel > div:nth-child(${nthSizeButton})`
  );

  await btn.click();
}

export async function openComponentToolbarMoreMenu(page: Page) {
  const btn = page
    .locator('edgeless-component-toolbar edgeless-tool-icon-button')
    .filter({
      hasText: 'More',
    });

  await btn.click();
}

export async function clickComponentToolbarMoreMenuButton(
  page: Page,
  button: 'delete'
) {
  const text = {
    delete: 'Delete',
  }[button];

  const btn = locatorComponentToolbarMoreButton(page)
    .locator('.action-item')
    .filter({ hasText: text });

  await btn.click();
}

// stepX/Y may not equal to wheel event delta.
// Chromium reports deltaX/deltaY scaled by host device scale factor.
// https://bugs.chromium.org/p/chromium/issues/detail?id=1324819
export async function zoomByMouseWheel(
  page: Page,
  stepX: number,
  stepY: number
) {
  await page.keyboard.down(SHORT_KEY);
  await page.mouse.wheel(stepX, stepY);
  await page.keyboard.up(SHORT_KEY);
}

export async function zoomFitByKeyboard(page: Page) {
  await page.keyboard.press(`${SHORT_KEY}+1`, { delay: 100 });
  await waitNextFrame(page, 300);
}

export async function zoomOutByKeyboard(page: Page) {
  await page.keyboard.press(`${SHORT_KEY}+-`, { delay: 100 });
  await waitNextFrame(page, 300);
}

export async function zoomResetByKeyboard(page: Page) {
  await page.keyboard.press(`${SHORT_KEY}+0`, { delay: 50 });
  // Wait for animation
  await waitNextFrame(page, 300);
}

export async function zoomInByKeyboard(page: Page) {
  await page.keyboard.press(`${SHORT_KEY}+=`, { delay: 50 });
  await waitNextFrame(page, 300);
}

export async function getZoomLevel(page: Page) {
  const screenWidth = page.viewportSize()?.width;
  assertExists(screenWidth);
  let zoomBarClass = 'horizontal';
  if (screenWidth < ZOOM_BAR_RESPONSIVE_SCREEN_WIDTH) {
    await toggleZoomBarWhenSmallScreenWidth(page);
    zoomBarClass = 'vertical';
  }
  const span = page.locator(
    `.edgeless-zoom-toolbar-container.${zoomBarClass} .zoom-percent`
  );
  await waitNextFrame(page, 60 / 0.25);
  const text = await span.textContent();
  if (!text) {
    throw new Error('Missing .zoom-percent');
  }
  return Number(text.replace('%', ''));
}

export async function optionMouseDrag(
  page: Page,
  start: number[],
  end: number[]
) {
  start = await toViewCoord(page, start);
  end = await toViewCoord(page, end);
  await page.keyboard.down('Alt');
  await dragBetweenCoords(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] },
    { steps: 30 }
  );
  await page.keyboard.up('Alt');
}

export async function shiftClick(page: Page, point: IPoint) {
  await page.keyboard.down(SHIFT_KEY);
  await page.mouse.click(point.x, point.y);
  await page.keyboard.up(SHIFT_KEY);
}

export async function shiftClickView(page: Page, point: [number, number]) {
  await page.keyboard.down(SHIFT_KEY);
  await clickView(page, point);
  await page.keyboard.up(SHIFT_KEY);
}

export async function deleteAll(page: Page) {
  await selectAllByKeyboard(page);
  await pressBackspace(page);
}

export async function deleteAllConnectors(page: Page) {
  return await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    container.surface.getElementsByType('connector').forEach(c => {
      container.surface.removeElement(c.id);
    });
  });
}

export function locatorComponentToolbar(page: Page) {
  return page.locator('edgeless-component-toolbar');
}

function locatorComponentToolbarMoreButton(page: Page) {
  const moreButton = locatorComponentToolbar(page).locator(
    'edgeless-more-button'
  );
  return moreButton;
}
type Action =
  | 'bringToFront'
  | 'bringForward'
  | 'sendBackward'
  | 'sendToBack'
  | 'copyAsPng'
  | 'changeNoteColor'
  | 'changeShapeStyle'
  | 'changeShapeFillColor'
  | 'changeShapeStrokeColor'
  | 'changeShapeStrokeStyles'
  | 'changeConnectorStrokeColor'
  | 'changeConnectorStrokeStyles'
  | 'addFrame'
  | 'addGroup'
  | 'ungroup'
  | 'releaseFromGroup'
  | 'createFrameOnMoreOption'
  | 'duplicate'
  | 'renameGroup'
  | 'autoSize';

export async function triggerComponentToolbarAction(
  page: Page,
  action: Action
) {
  switch (action) {
    case 'bringToFront': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Bring to Front',
        });
      await actionButton.click();
      break;
    }
    case 'bringForward': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Bring Forward',
        });
      await actionButton.click();
      break;
    }
    case 'sendBackward': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Send Backward',
        });
      await actionButton.click();
      break;
    }
    case 'sendToBack': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Send to Back',
        });
      await actionButton.click();
      break;
    }
    case 'copyAsPng': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Copy as PNG',
        });
      await actionButton.click();
      break;
    }
    case 'createFrameOnMoreOption': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Frame Section',
        });
      await actionButton.click();
      break;
    }
    case 'duplicate': {
      const moreButton = locatorComponentToolbarMoreButton(page);
      await moreButton.click();

      const actionButton = moreButton
        .locator('.more-actions-container .action-item')
        .filter({
          hasText: 'Duplicate',
        });
      await actionButton.click();
      break;
    }
    case 'changeNoteColor': {
      const button = locatorComponentToolbar(page).locator(
        'edgeless-change-note-button .fill-color-button'
      );
      await button.click();
      break;
    }
    case 'changeShapeFillColor': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-shape-button')
        .locator('.fill-color-button');
      await button.click();
      break;
    }
    case 'changeShapeStrokeColor': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-shape-button')
        .locator('.stroke-color-button');
      await button.click();
      break;
    }
    case 'changeShapeStrokeStyles': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-shape-button')
        .locator('.line-styles-button');
      await button.click();
      break;
    }
    case 'changeShapeStyle': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-shape-button')
        .locator('.shape-style-button');
      await button.click();
      break;
    }
    case 'changeConnectorStrokeColor': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-connector-button')
        .locator('.connector-color-button');
      await button.click();
      break;
    }
    case 'changeConnectorStrokeStyles': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-connector-button')
        .locator('.line-styles-button');
      await button.click();
      break;
    }
    case 'addFrame': {
      const button = locatorComponentToolbar(page).locator(
        'edgeless-add-frame-button'
      );
      await button.click();
      break;
    }
    case 'addGroup': {
      const button = locatorComponentToolbar(page).locator(
        'edgeless-add-group-button'
      );
      await button.click();
      break;
    }
    case 'ungroup': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-group-button')
        .locator('.edgeless-component-toolbar-ungroup-button');
      await button.click();
      break;
    }
    case 'renameGroup': {
      const button = locatorComponentToolbar(page)
        .locator('edgeless-change-group-button')
        .locator('.edgeless-component-toolbar-group-rename-button');
      await button.click();
      break;
    }
    case 'releaseFromGroup': {
      const button = locatorComponentToolbar(page).locator(
        'edgeless-release-from-group-button'
      );
      await button.click();
      break;
    }
    case 'autoSize': {
      const button = locatorComponentToolbar(page).locator(
        'edgeless-change-note-button .edgeless-auto-height-button'
      );
      await button.click();
      break;
    }
  }
}

export async function changeEdgelessNoteBackground(
  page: Page,
  color: CssVariableName
) {
  const colorButton = page.locator(
    `edgeless-change-note-button .color-unit[aria-label="${color}"]`
  );
  await colorButton.click();
}

export async function changeShapeFillColor(page: Page, color: CssVariableName) {
  const colorButton = page
    .locator('edgeless-change-shape-button')
    .locator('.color-panel-container.fill-color')
    .locator(`.color-unit[aria-label="${color}"]`);
  await colorButton.click();
}

export async function changeShapeStrokeColor(
  page: Page,
  color: CssVariableName
) {
  const colorButton = page
    .locator('edgeless-change-shape-button')
    .locator('.color-panel-container.stroke-color')
    .locator(`.color-unit[aria-label="${color}"]`);
  await colorButton.click();
}

export async function resizeConnectorByStartCapitalHandler(
  page: Page,
  delta: { x: number; y: number },
  steps = 1
) {
  const handler = page.locator(
    '.affine-edgeless-selected-rect .line-controller.line-start'
  );
  const box = await handler.boundingBox();
  if (box === null) throw new Error();
  const offset = 5;
  await dragBetweenCoords(
    page,
    { x: box.x + offset, y: box.y + offset },
    { x: box.x + delta.x + offset, y: box.y + delta.y + offset },
    {
      steps,
    }
  );
}

export function getEdgelessLineWidthPanel(page: Page) {
  return page
    .locator('edgeless-change-shape-button')
    .locator('.line-style-panel')
    .locator(`edgeless-line-width-panel`);
}
export async function changeShapeStrokeWidth(page: Page) {
  const lineWidthPanel = getEdgelessLineWidthPanel(page);
  const lineWidthPanelRect = await lineWidthPanel.boundingBox();
  assertExists(lineWidthPanelRect);
  // click line width panel by position
  const x = lineWidthPanelRect.x + 40;
  const y = lineWidthPanelRect.y + 10;
  await page.mouse.click(x, y);
}

export function locatorShapeStrokeStyleButton(
  page: Page,
  mode: 'solid' | 'dash' | 'none'
) {
  return page
    .locator('edgeless-change-shape-button')
    .locator('.line-style-panel')
    .locator(`.edgeless-component-line-style-button.mode-${mode}`);
}

export async function changeShapeStrokeStyle(
  page: Page,
  mode: 'solid' | 'dash' | 'none'
) {
  const button = locatorShapeStrokeStyleButton(page, mode);
  await button.click();
}

export function locatorShapeStyleButton(
  page: Page,
  style: 'general' | 'scribbled'
) {
  return page
    .locator('edgeless-change-shape-button')
    .locator('edgeless-shape-style-panel')
    .locator(`edgeless-tool-icon-button.${style}-shape-button`);
}

export async function changeShapeStyle(
  page: Page,
  style: 'general' | 'scribbled'
) {
  const button = locatorShapeStyleButton(page, style);
  await button.click();
}

export async function changeConnectorStrokeColor(
  page: Page,
  color: CssVariableName
) {
  const colorButton = page
    .locator('edgeless-change-connector-button')
    .locator('edgeless-color-panel')
    .locator(`.color-unit[aria-label="${color}"]`);
  await colorButton.click();
}

export function locatorConnectorStrokeWidthButton(
  page: Page,
  buttonPosition: number
) {
  return page
    .locator('edgeless-change-connector-button')
    .locator(`edgeless-line-width-panel`)
    .locator(`.line-width-button:nth-child(${buttonPosition})`);
}
export async function changeConnectorStrokeWidth(
  page: Page,
  buttonPosition: number
) {
  const button = locatorConnectorStrokeWidthButton(page, buttonPosition);
  await button.click();
}

export function locatorConnectorStrokeStyleButton(
  page: Page,
  mode: 'solid' | 'dash' | 'none'
) {
  return page
    .locator('edgeless-change-connector-button')
    .locator(`.edgeless-component-line-style-button-${mode}`);
}
export async function changeConnectorStrokeStyle(
  page: Page,
  mode: 'solid' | 'dash' | 'none'
) {
  const button = locatorConnectorStrokeStyleButton(page, mode);
  await button.click();
}

export async function initThreeOverlapFilledShapes(page: Page) {
  const rect0 = {
    start: { x: 100, y: 100 },
    end: { x: 200, y: 200 },
  };
  await addBasicRectShapeElement(page, rect0.start, rect0.end);
  await page.mouse.click(rect0.start.x + 5, rect0.start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeFillColor');
  await changeShapeFillColor(page, '--affine-palette-shape-navy');

  const rect1 = {
    start: { x: 130, y: 130 },
    end: { x: 230, y: 230 },
  };
  await addBasicRectShapeElement(page, rect1.start, rect1.end);
  await page.mouse.click(rect1.start.x + 5, rect1.start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeFillColor');
  await changeShapeFillColor(page, '--affine-palette-shape-black');

  const rect2 = {
    start: { x: 160, y: 160 },
    end: { x: 260, y: 260 },
  };
  await addBasicRectShapeElement(page, rect2.start, rect2.end);
  await page.mouse.click(rect2.start.x + 5, rect2.start.y + 5);
  await triggerComponentToolbarAction(page, 'changeShapeFillColor');
  await changeShapeFillColor(page, '--affine-palette-shape-white');
}

export async function initThreeOverlapNotes(page: Page, x = 130, y = 140) {
  await addNote(page, 'abc', x, y);
  await addNote(page, 'efg', x + 30, y);
  await addNote(page, 'hij', x + 60, y);
}

export async function initThreeNotes(page: Page) {
  await addNote(page, 'abc', 30 + 100, 40 + 100);
  await addNote(page, 'efg', 30 + 130, 40 + 200);
  await addNote(page, 'hij', 30 + 160, 40 + 300);
}

export async function toViewCoord(page: Page, point: number[]) {
  return await page.evaluate(point => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    return container.surface.viewport.toViewCoord(point[0], point[1]);
  }, point);
}

export async function dragBetweenViewCoords(
  page: Page,
  start: number[],
  end: number[]
) {
  const [startX, startY] = await toViewCoord(page, start);
  const [endX, endY] = await toViewCoord(page, end);
  await dragBetweenCoords(page, { x: startX, y: startY }, { x: endX, y: endY });
}

export async function toModelCoord(page: Page, point: number[]) {
  return await page.evaluate(point => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    return container.surface.viewport.toModelCoord(point[0], point[1]);
  }, point);
}

export async function getConnectorSourceConnection(page: Page) {
  return await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    return container.surface.getElementsByType('connector')[0].source;
  });
}

export async function getConnectorPath(page: Page, index = 0) {
  return await page.evaluate(
    ([index]) => {
      const container = document.querySelector('affine-edgeless-page');
      if (!container) throw new Error('container not found');
      const connectors = container.surface.getElementsByType('connector');
      return connectors[index].absolutePath;
    },
    [index]
  );
}

export async function getSelectedBound(
  page: Page,
  index = 0
): Promise<[number, number, number, number]> {
  return await page.evaluate(
    ([index]) => {
      const container = document.querySelector('affine-edgeless-page');
      if (!container) throw new Error('container not found');
      const selected = container.selectionManager.elements[index];
      return JSON.parse(selected.xywh);
    },
    [index]
  );
}

export async function getGroupIds(page: Page) {
  return await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    return container.surface
      .getElements()
      .map(g => container.surface.getGroupParent(g).id);
  });
}

export async function getGroupChildrenIds(page: Page, index = 0) {
  return await page.evaluate(
    ([index]) => {
      const container = document.querySelector('affine-edgeless-page');
      if (!container) throw new Error('container not found');
      return Array.from(
        container.surface.getElementsByType('group')[index].children.keys()
      );
    },
    [index]
  );
}

export async function getPhasorElementsCount(page: Page) {
  return await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    return container.surface.getElements().length;
  });
}

export async function getIds(page: Page) {
  return await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    return container.surface.getElements().map(e => e.id);
  });
}

export async function getIndexes(page: Page) {
  return await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    return container.surface.getElements().map(e => e.index);
  });
}

export async function getSortedIdsInViewport(page: Page) {
  return await page.evaluate(() => {
    const container = document.querySelector('affine-edgeless-page');
    if (!container) throw new Error('container not found');
    const { surface } = container;
    return surface.viewport.gridManager
      .search(surface.viewport.viewportBounds)
      .map(e => e.id);
  });
}

export async function edgelessCommonSetup(page: Page) {
  await enterPlaygroundRoom(page);
  await initEmptyEdgelessState(page);
  await switchEditorMode(page);
  await deleteAll(page);
}

export async function createShapeElement(
  page: Page,
  coord1: number[],
  coord2: number[],
  shape = Shape.Square
) {
  const start = await toViewCoord(page, coord1);
  const end = await toViewCoord(page, coord2);
  await addBasicShapeElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] },
    shape
  );
}

export async function createConnectorElement(
  page: Page,
  coord1: number[],
  coord2: number[]
) {
  const start = await toViewCoord(page, coord1);
  const end = await toViewCoord(page, coord2);
  await addBasicConnectorElement(
    page,
    { x: start[0], y: start[1] },
    { x: end[0], y: end[1] }
  );
}

export async function hoverOnNote(page: Page, id: string, offset = [0, 0]) {
  const blockRect = await page.locator(`[data-block-id="${id}"]`).boundingBox();

  assertExists(blockRect);

  await page.mouse.move(
    blockRect.x + blockRect.width / 2 + offset[0],
    blockRect.y + blockRect.height / 2 + offset[1]
  );
}

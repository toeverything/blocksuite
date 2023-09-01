import { assertExists } from '@blocksuite/global/utils';
import {
  Bound,
  ConnectorElement,
  FrameElement,
  inflateBound,
  type PhasorElementType,
} from '@blocksuite/phasor';

import type { EdgelessElement } from '../../../index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { edgelessElementsBound, getGridBound } from './bound-utils.js';
import { isTopLevelBlock } from './query.js';

export function getCopyElements(
  edgeless: EdgelessPageBlockComponent,
  elements: EdgelessElement[]
) {
  const set = new Set<EdgelessElement>();

  elements.forEach(element => {
    if (element instanceof FrameElement) {
      set.add(element);
      edgeless.frame.getElementsInFrame(element).forEach(ele => set.add(ele));
    } else {
      set.add(element);
    }
  });
  return Array.from(set);
}

const offset = 10;
export async function duplicate(
  edgeless: EdgelessPageBlockComponent,
  elements: EdgelessElement[],
  select = true
) {
  const { surface, page } = edgeless;
  const totalBound = edgelessElementsBound(elements);
  const newElements = await Promise.all(
    getCopyElements(edgeless, elements).map(async element => {
      const bound =
        element instanceof FrameElement
          ? Bound.deserialize(element.xywh)
          : getGridBound(element);
      bound.x += totalBound.w + offset;
      if (isTopLevelBlock(element)) {
        const noteService = edgeless.getService('affine:note');

        const id = page.addBlock(
          'affine:note',
          { xywh: bound.serialize() },
          page.root?.id
        );
        const note = page.getBlockById(id);

        assertExists(note);
        await noteService.json2Block(
          note,
          noteService.block2Json(element).children
        );
        return id;
      } else {
        const id = surface.addElement(
          element.type as keyof PhasorElementType,
          {
            ...element.serialize(),
            xywh: bound.serialize(),
          } as unknown as Record<string, unknown>
        );
        const newElement = surface.pickById(id);
        assertExists(newElement);
        if (newElement instanceof ConnectorElement) {
          edgeless.connector.updateXYWH(newElement, bound);
        }
        return id;
      }
    })
  );
  handleZoom(newElements, edgeless);

  if (select) {
    edgeless.selectionManager.setSelection({
      elements: newElements,
      editing: false,
    });
  }
}

function handleZoom(
  newElementIds: string[],
  edgeless: EdgelessPageBlockComponent
) {
  const { surface } = edgeless;
  const { viewport } = surface;
  const newElements = Array.from(newElementIds, id => surface.pickById(id));
  let totalBound = edgelessElementsBound(newElements as EdgelessElement[]);
  totalBound = inflateBound(totalBound, 30);
  let zoom = viewport.zoom;
  const originViewBound = getBoundByZoom(
    Bound.from(viewport.viewportBounds),
    1 / zoom
  );
  let currentViewBound = Bound.from(viewport.viewportBounds);
  while (!currentViewBound.contains(totalBound)) {
    zoom -= 0.01;
    currentViewBound = getBoundByZoom(Bound.from(originViewBound), zoom);
    if (zoom === 0.1) break;
  }
  viewport.smoothZoom(zoom);
}

function getBoundByZoom(originBound: Bound, zoom: number) {
  let { w, h } = originBound;
  const [centerX, centerY] = originBound.center;
  w = w / zoom;
  h = h / zoom;
  return new Bound(centerX - w / 2, centerY - h / 2, w, h);
}

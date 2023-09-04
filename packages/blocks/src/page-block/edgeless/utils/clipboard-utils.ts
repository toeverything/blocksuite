import { assertExists } from '@blocksuite/global/utils';

import {
  getBlockClipboardInfo,
  getCopyElements,
} from '../../../__internal__/clipboard/index.js';
import type { EdgelessElement } from '../../../index.js';
import {
  Bound,
  ConnectorElement,
  FrameElement,
  inflateBound,
  type PhasorElementType,
} from '../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { edgelessElementsBound, getGridBound } from './bound-utils.js';
import { isTopLevelBlock } from './query.js';

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
        const serializedBlock = (await getBlockClipboardInfo(element)).json;
        await noteService.json2Block(note, serializedBlock.children);
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
  const { surface, page } = edgeless;
  const { viewport } = surface;
  const newElements = Array.from(
    newElementIds,
    id => surface.pickById(id) ?? page.getBlockById(id)
  );
  let totalBound = edgelessElementsBound(newElements as EdgelessElement[]);
  totalBound = inflateBound(totalBound, 30);
  let currentViewBound = Bound.from(viewport.viewportBounds);
  while (!currentViewBound.contains(totalBound)) {
    const offset = 0.1;
    const ratio = viewport.viewportBounds.h / viewport.viewportBounds.w;
    const expandHeight = ratio * offset;
    currentViewBound = currentViewBound.expand(offset, expandHeight);
  }
  viewport.setViewportByBound(currentViewBound, [0, 0, 0, 0], true);
}

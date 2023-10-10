import { assertExists } from '@blocksuite/global/utils';
import { Workspace } from '@blocksuite/store';

import {
  getBlockClipboardInfo,
  getCopyElements,
} from '../../../__internal__/clipboard/index.js';
import type { EdgelessElement } from '../../../__internal__/index.js';
import type { FrameBlockService } from '../../../__internal__/service/legacy-services/frame-service.js';
import {
  Bound,
  ConnectorElement,
  inflateBound,
} from '../../../surface-block/index.js';
import type { EdgelessPageBlockComponent } from '../edgeless-page-block.js';
import { edgelessElementsBound, getGridBound } from './bound-utils.js';
import { isFrameBlock, isNoteBlock } from './query.js';

const offset = 10;
export async function duplicate(
  edgeless: EdgelessPageBlockComponent,
  elements: EdgelessElement[],
  select = true
) {
  const { surface, page } = edgeless;
  const totalBound = edgelessElementsBound(elements);
  const newElements = await Promise.all(
    getCopyElements(surface, elements).map(async element => {
      const bound = isFrameBlock(element)
        ? Bound.fromXYWH(element.xywh)
        : getGridBound(element);
      bound.x += totalBound.w + offset;
      if (isNoteBlock(element)) {
        const id = page.addBlock(
          element.flavour,
          { xywh: bound.serialize() },
          page.root?.id
        );
        const block = page.getBlockById(id);

        assertExists(block);
        const serializedBlock = (await getBlockClipboardInfo(element)).json;

        const service = edgeless.getService(element.flavour);
        await service.json2Block(block, serializedBlock.children);

        return id;
      } else if (isFrameBlock(element)) {
        const service = edgeless.getService(
          element.flavour
        ) as FrameBlockService;
        const json = service.block2Json(element);
        const id = page.addBlock(
          element.flavour,
          {
            xywh: bound.serialize(),
            title: new Workspace.Y.Text(json.title),
            background: json.background,
          },
          surface.model.id
        );

        return id;
      } else {
        const id = surface.addElement(element.type, {
          ...element.serialize(),
          xywh: bound.serialize(),
        } as unknown as Record<string, unknown>);
        const newElement = surface.pickById(id);
        assertExists(newElement);
        if (newElement instanceof ConnectorElement) {
          surface.connector.updateXYWH(newElement, bound);
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
  currentViewBound = currentViewBound.unite(totalBound);
  viewport.setViewportByBound(currentViewBound, [0, 0, 0, 0], true);
}

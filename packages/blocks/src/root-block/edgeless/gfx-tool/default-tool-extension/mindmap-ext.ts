import type { GfxModel } from '@blocksuite/block-std/gfx';

import { MindmapUtils } from '@blocksuite/affine-block-surface';
import {
  MindmapElementModel,
  type MindmapNode,
  type ShapeElementModel,
} from '@blocksuite/affine-model';
import { Bound, intersects } from '@blocksuite/global/utils';

import { isSingleMindMapNode } from '../../../../_common/edgeless/mindmap/index.js';
import {
  type DragBehaviorContext,
  DragBehaviorExtension,
} from '../default-tool.js';

type MindMapDragContext = {
  mindmap: MindmapElementModel;
  node: MindmapNode;
  originMindMapBound: Bound;
  clearFn?: () => void;
  detach?: boolean;
};

type MindMapHoveredContext = {
  mindmap: MindmapElementModel;
  node: MindmapNode;
  mergeInfo?: Exclude<
    ReturnType<typeof MindmapUtils.showMergeIndicator>,
    undefined
  >['mergeInfo'];
};

export class MindMapDragExtension extends DragBehaviorExtension {
  static override key = 'mindmap-drag';

  private _createDragHandlers(
    initialMindmapDragCtx: MindMapDragContext,
    dragContext: DragBehaviorContext
  ) {
    let clearFns: (() => void)[] = [];
    let hoveredMindMapCtx: null | MindMapHoveredContext = null;
    let draggedMindMapCtx: null | MindMapDragContext = initialMindmapDragCtx;

    return {
      dragMove: () => {
        clearFns.forEach(fn => fn());
        clearFns = [];

        if (!draggedMindMapCtx) {
          return;
        }

        const {
          node: draggedNode,
          mindmap: draggedMindMap,
          originMindMapBound: startElementBound,
        } = draggedMindMapCtx;
        const [x, y] = this.defaultTool.dragLastPos;

        hoveredMindMapCtx = this._getHoveredMindMap(draggedNode.element);

        // when the dragged node hover on another mindmap
        // show the merge indicator and hide its own node connector
        if (hoveredMindMapCtx) {
          const { node, mindmap } = hoveredMindMapCtx;

          // hovered node visual effect
          node.element.opacity = 0.8;
          clearFns.push(() => {
            node.element.opacity = 1;
          });

          const candidateMergeInfo = MindmapUtils.showMergeIndicator(
            mindmap,
            node,
            draggedNode,
            [x, y]
          );
          if (candidateMergeInfo) {
            clearFns.push(candidateMergeInfo.clear);
            hoveredMindMapCtx.mergeInfo = candidateMergeInfo.mergeInfo;
          }

          clearFns.push(
            MindmapUtils.hideNodeConnector(draggedMindMap, draggedNode)
          );

          const layoutType = hoveredMindMapCtx.mergeInfo?.layoutType;

          draggedMindMap.layout(draggedNode, false, layoutType);
        } else {
          const bound = new Bound(x, y, 40, 40);

          if (
            !(
              intersects(startElementBound, bound) ||
              startElementBound.contains(bound)
            ) &&
            draggedMindMap.tree.id !== draggedNode.id
          ) {
            clearFns.push(
              MindmapUtils.hideNodeConnector(draggedMindMap, draggedNode)
            );
            draggedMindMapCtx.detach = true;
          } else {
            draggedMindMapCtx.detach = false;
          }

          draggedMindMap.layout(draggedNode, false);
          draggedMindMapCtx = null;
        }
      },
      dragEnd: () => {
        clearFns.forEach(fn => fn());
        clearFns = [];

        if (!draggedMindMapCtx) {
          dragContext.dragElements.forEach(el => {
            if (el instanceof MindmapElementModel) {
              el.requestLayout();
            }
          });
          return;
        }

        if (hoveredMindMapCtx?.mergeInfo) {
          const { mergeInfo, mindmap } = hoveredMindMapCtx;
          const { node: currentNode, mindmap: currentMindmap } =
            draggedMindMapCtx;

          MindmapUtils.moveMindMapSubtree(
            currentMindmap,
            currentNode!,
            mindmap,
            mergeInfo.target,
            mergeInfo.index,
            mergeInfo.layoutType
          );
        } else if (draggedMindMapCtx.detach) {
          const { mindmap } = draggedMindMapCtx;
          const subtree = MindmapUtils.detachMindmap(
            draggedMindMapCtx.mindmap,
            draggedMindMapCtx.node
          );

          if (subtree) {
            MindmapUtils.createFromTree(
              subtree,
              mindmap.style,
              mindmap.layoutType,
              this.gfx.surface!
            );
          }
        } else {
          draggedMindMapCtx.mindmap.layout();
        }

        draggedMindMapCtx.clearFn?.();
      },
    };
  }

  private _getHoveredMindMap(exclude: GfxModel) {
    const [x, y] = this.defaultTool.dragLastPos;

    return this.gfx
      .getElementByPoint(x, y, {
        all: true,
        responsePadding: [25, 60],
      })
      .filter(
        el =>
          el !== exclude &&
          (el.group as BlockSuite.SurfaceElementModel)?.type === 'mindmap'
      )
      .map(el => ({
        element: el as ShapeElementModel,
        node: (el.group as MindmapElementModel).getNode(el.id)!,
        mindmap: el.group as MindmapElementModel,
      }))[0];
  }

  private _setupSnap(
    mindmapDragCtx: MindMapDragContext,
    ctx: DragBehaviorContext
  ) {
    const draggedNode = mindmapDragCtx.node;
    const mindMap = mindmapDragCtx.mindmap;

    // If the dragged node is the root node of the mindmap.
    // It should not be able to snap to other node in the same mind map
    if (draggedNode.id === mindMap.tree.id) {
      ctx.snap.addExclusion([mindMap, ...mindMap.childElements]);
    }
    // Otherwise, it means the dragged node is not the root node of the mindmap
    // then the snap should be disabled completely
    else {
      ctx.snap.resetSnapState();
    }
  }

  override initializeDragEvent(ctx: DragBehaviorContext) {
    if (!isSingleMindMapNode(ctx.dragElements)) {
      return {};
    }

    const draggedNode = ctx.dragElements[0];
    const draggedMindMap = draggedNode.group as MindmapElementModel;
    const draggedMindMapCtx: null | MindMapDragContext = {
      mindmap: draggedMindMap,
      node: draggedMindMap.getNode(draggedNode.id)!,
      clearFn: draggedMindMap.stashTree(draggedNode.id),
      originMindMapBound: draggedMindMap.elementBound,
    };

    this._setupSnap(draggedMindMapCtx, ctx);
    return this._createDragHandlers(draggedMindMapCtx, ctx);
  }
}

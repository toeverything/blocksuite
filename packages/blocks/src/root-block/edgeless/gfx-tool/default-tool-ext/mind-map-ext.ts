import type { PointerEventState } from '@blocksuite/block-std';
import type { Bound, IVec } from '@blocksuite/global/utils';

import {
  MindmapUtils,
  NODE_HORIZONTAL_SPACING,
  NODE_VERTICAL_SPACING,
} from '@blocksuite/affine-block-surface';
import {
  type LayoutType,
  type LocalConnectorElementModel,
  MindmapElementModel,
  type MindmapNode,
} from '@blocksuite/affine-model';
import {
  type GfxModel,
  isGfxGroupCompatibleModel,
} from '@blocksuite/block-std/gfx';

import {
  isMindmapNode,
  isSelectSingleMindMap,
} from '../../../../_common/edgeless/mindmap/index.js';
import { DefaultModeDragType, DefaultToolExt, type DragState } from './ext.js';

type DragMindMapCtx = {
  mindmap: MindmapElementModel;
  node: MindmapNode;
  clear?: () => void;
  originalMindMapBound: Bound;
};

export class MindMapExt extends DefaultToolExt {
  /**
   * Create handlers that can drag and drop mind map nodes
   * @param dragMindMapCtx
   * @param dragState
   * @returns
   */
  private _createManipulationHandlers(
    dragMindMapCtx: DragMindMapCtx,
    _: DragState
  ): {
    dragStart?: (evt: PointerEventState) => void;
    dragMove?: (evt: PointerEventState) => void;
    dragEnd?: (evt: PointerEventState) => void;
  } {
    let hoveredCtx: {
      mindmap: MindmapElementModel | null;
      node: MindmapNode | null;
      detach?: boolean;
      abort?: () => void;
      merge?: () => void;
    } | null = null;

    return {
      dragMove: (_: PointerEventState) => {
        const [x, y] = this.defaultTool.dragLastPos;
        const hoveredMindMap = this._getHoveredMindMap([x, y], dragMindMapCtx);

        hoveredCtx?.abort?.();

        const hoveredNode = hoveredMindMap
          ? MindmapUtils.findTargetNode(hoveredMindMap, [x, y])
          : null;

        hoveredCtx = {
          mindmap: hoveredMindMap,
          node: hoveredNode,
        };

        const layoutDragNode = () => {
          const layoutType: LayoutType = dragMindMapCtx.mindmap.getLayoutDir(
            dragMindMapCtx.node
          );

          dragMindMapCtx.mindmap.layout(dragMindMapCtx.node, {
            layoutType,
            calculateTreeBound: false,
          });

          return () => {
            delete dragMindMapCtx.node.overriddenDir;
          };
        };

        if (
          hoveredMindMap &&
          hoveredNode &&
          !MindmapUtils.containsNode(
            hoveredMindMap,
            hoveredNode,
            dragMindMapCtx.node
          )
        ) {
          const operation = MindmapUtils.tryMoveNode(
            hoveredMindMap,
            hoveredNode,
            dragMindMapCtx.mindmap,
            dragMindMapCtx.node,
            [x, y]
          );

          if (operation) {
            hoveredCtx.abort = operation.abort;
            hoveredCtx.merge = operation.merge;
          } else {
            hoveredCtx.abort = layoutDragNode();
          }
        } else {
          const clearDragState = layoutDragNode();

          if (!hoveredCtx.mindmap) {
            hoveredCtx.detach = true;

            const reset = (hoveredCtx.abort = MindmapUtils.hideNodeConnector(
              dragMindMapCtx.mindmap,
              dragMindMapCtx.node
            ));

            hoveredCtx.abort = () => {
              reset?.();
              clearDragState();
            };
          } else {
            hoveredCtx.abort = clearDragState;
          }
        }
      },
      dragEnd: () => {
        if (hoveredCtx?.merge) {
          hoveredCtx.abort?.();
          hoveredCtx.merge();
        } else {
          hoveredCtx?.abort?.();

          if (
            hoveredCtx?.detach &&
            dragMindMapCtx.node !== dragMindMapCtx.mindmap.tree
          ) {
            MindmapUtils.detachMindmap(
              dragMindMapCtx.mindmap,
              dragMindMapCtx.node
            );
            MindmapUtils.createFromTree(
              dragMindMapCtx.node,
              dragMindMapCtx.mindmap.style,
              dragMindMapCtx.mindmap.layoutType,
              this.gfx.surface!
            );
          } else {
            // restore the original mind map bound
            dragMindMapCtx.mindmap.layout();
          }
        }

        hoveredCtx = null;
        dragMindMapCtx.clear?.();
      },
    };
  }

  /**
   * Create handlers that can translate entire mind map
   */
  private _createTranslationHandlers(
    _: DragState,
    ctx: {
      mindmaps: Set<MindmapElementModel>;
      nodes: Set<GfxModel>;
    }
  ): {
    dragStart?: (evt: PointerEventState) => void;
    dragMove?: (evt: PointerEventState) => void;
    dragEnd?: (evt: PointerEventState) => void;
  } {
    return {
      dragStart: (_: PointerEventState) => {
        ctx.nodes.forEach(node => {
          node.stash('xywh');
        });
      },
      dragEnd: (_: PointerEventState) => {
        ctx.mindmaps.forEach(mindmap => {
          mindmap.layout();
        });
      },
    };
  }

  private _getHoveredMindMap(
    position: IVec,
    dragMindMapCtx: DragMindMapCtx
  ): MindmapElementModel | null {
    return (
      (this.gfx
        .getElementByPoint(position[0], position[1], {
          all: true,
          responsePadding: [NODE_HORIZONTAL_SPACING, NODE_VERTICAL_SPACING / 2],
        })
        .find(el => {
          if (!(el instanceof MindmapElementModel)) {
            return false;
          }

          if (
            el === dragMindMapCtx.mindmap &&
            !dragMindMapCtx.originalMindMapBound.containsPoint(position)
          ) {
            return false;
          }

          return true;
        }) as MindmapElementModel) ?? null
    );
  }

  private _updateNodeOpacity(
    mindmap: MindmapElementModel,
    mindNode: MindmapNode
  ) {
    const OPACITY = 0.3;
    const updatedNodes = new Set<
      BlockSuite.SurfaceElementModel | LocalConnectorElementModel
    >();
    const traverse = (node: MindmapNode, parent: MindmapNode | null) => {
      node.element.opacity = OPACITY;
      updatedNodes.add(node.element);

      if (parent) {
        const connectorId = `#${parent.element.id}-${node.element.id}`;
        const connector = mindmap.connectors.get(connectorId);

        if (connector) {
          connector.opacity = OPACITY;
          updatedNodes.add(connector);
        }
      }

      if (node.children.length) {
        node.children.forEach(child => traverse(child, node));
      }
    };

    const parentNode = mindmap.getParentNode(mindNode.element.id) ?? null;

    traverse(mindNode, parentNode);

    return () => {
      updatedNodes.forEach(el => {
        el.opacity = 1;
      });
    };
  }

  override initDrag(dragState: DragState) {
    if (dragState.dragType !== DefaultModeDragType.ContentMoving) {
      return {};
    }

    if (isSelectSingleMindMap(dragState.movedElements)) {
      const mindmap = dragState.movedElements[0].group as MindmapElementModel;
      const mindmapNode = mindmap.getNode(dragState.movedElements[0].id)!;
      const mindmapBound = mindmap.elementBound;

      mindmapBound.x -= NODE_HORIZONTAL_SPACING;
      mindmapBound.y -= NODE_VERTICAL_SPACING / 2;
      mindmapBound.w += NODE_HORIZONTAL_SPACING * 2;
      mindmapBound.h += NODE_VERTICAL_SPACING;

      const clearOpacity = this._updateNodeOpacity(mindmap, mindmapNode);
      const clearStash = mindmap.stashTree(mindmapNode);
      const mindMapDragCtx: DragMindMapCtx = {
        mindmap,
        node: mindmapNode,
        clear: () => {
          clearOpacity();
          clearStash?.();
        },
        originalMindMapBound: mindmapBound,
      };

      return this._createManipulationHandlers(mindMapDragCtx, dragState);
    }

    const mindmapNodes = new Set<GfxModel>();
    const mindmaps = new Set<MindmapElementModel>();
    dragState.movedElements.forEach(el => {
      if (isMindmapNode(el)) {
        const mindmap =
          el.group instanceof MindmapElementModel
            ? el.group
            : (el as MindmapElementModel);

        mindmaps.add(mindmap);
        mindmap.childElements.forEach(child => mindmapNodes.add(child));
      } else if (isGfxGroupCompatibleModel(el)) {
        el.descendantElements.forEach(desc => {
          if (desc.group instanceof MindmapElementModel) {
            mindmaps.add(desc.group);
            desc.group.childElements.forEach(_el => mindmapNodes.add(_el));
          }
        });
      }
    });

    if (mindmapNodes.size > 1) {
      mindmapNodes.forEach(node => dragState.movedElements.push(node));
      return this._createTranslationHandlers(dragState, {
        mindmaps,
        nodes: mindmapNodes,
      });
    }

    return {};
  }
}

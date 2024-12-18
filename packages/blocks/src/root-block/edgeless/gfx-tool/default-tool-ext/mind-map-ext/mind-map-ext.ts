import type { PointerEventState } from '@blocksuite/block-std';
import type { Bound, IVec } from '@blocksuite/global/utils';

import {
  MindmapUtils,
  NODE_HORIZONTAL_SPACING,
  NODE_VERTICAL_SPACING,
  OverlayIdentifier,
  type SurfaceBlockComponent,
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

import type { MindMapIndicatorOverlay } from './indicator-overlay.js';

import {
  isMindmapNode,
  isSingleMindMapNode,
} from '../../../../../_common/edgeless/mindmap/index.js';
import { DefaultModeDragType, DefaultToolExt, type DragState } from '../ext.js';
import { calculateResponseArea } from './drag-utils.js';

type DragMindMapCtx = {
  mindmap: MindmapElementModel;
  node: MindmapNode;
  clear?: () => void;
  originalMindMapBound: Bound;
  startPoint: PointerEventState;
};

export class MindMapExt extends DefaultToolExt {
  private _responseAreaUpdated = new Set<MindmapElementModel>();

  override supportedDragTypes: DefaultModeDragType[] = [
    DefaultModeDragType.ContentMoving,
  ];

  private get _indicatorOverlay() {
    return this.std.getOptional(
      OverlayIdentifier('mindmap-indicator')
    ) as MindMapIndicatorOverlay | null;
  }

  private _calcDragResponseArea(mindmap: MindmapElementModel) {
    calculateResponseArea(mindmap);
    this._responseAreaUpdated.add(mindmap);
  }

  /**
   * Create handlers that can drag and drop mind map nodes
   * @param dragMindMapCtx
   * @param dragState
   * @returns
   */
  private _createManipulationHandlers(dragMindMapCtx: DragMindMapCtx): {
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
        const indicator = this._indicatorOverlay;

        if (indicator) {
          indicator.currentDragPos = [x, y];
          indicator.refresh();
        }

        hoveredCtx?.abort?.();

        const hoveredNode = hoveredMindMap
          ? MindmapUtils.findTargetNode(hoveredMindMap, [x, y])
          : null;

        hoveredCtx = {
          mindmap: hoveredMindMap,
          node: hoveredNode,
        };

        // 1. not hovered on any mind map or
        // 2. hovered on the other mind map but not on any node
        // then consider user is trying to detach the node
        if (
          !hoveredMindMap ||
          (hoveredMindMap !== dragMindMapCtx.mindmap && !hoveredNode)
        ) {
          hoveredCtx.detach = true;

          const reset = (hoveredCtx.abort = MindmapUtils.hideNodeConnector(
            dragMindMapCtx.mindmap,
            dragMindMapCtx.node
          ));

          hoveredCtx.abort = () => {
            reset?.();
          };
        } else {
          // hovered on the currently dragging mind map but
          // 1. not hovered on any node or
          // 2. hovered on the node that is itself or its children (which is not allowed)
          // then consider user is trying to drop the node to its original position
          if (
            !hoveredNode ||
            MindmapUtils.containsNode(
              hoveredMindMap,
              hoveredNode,
              dragMindMapCtx.node
            )
          ) {
            const { mindmap, node } = dragMindMapCtx;

            // if the node is the root node, then do nothing
            if (node === mindmap.tree) {
              return;
            }

            const nodeBound = node.element.elementBound;

            hoveredCtx.abort = this._drawIndicator({
              targetMindMap: mindmap,
              target: node,
              sourceMindMap: mindmap,
              source: node,
              newParent: node.parent!,
              insertPosition: {
                type: 'sibling',
                layoutDir: mindmap.getLayoutDir(node) as Exclude<
                  LayoutType,
                  LayoutType.BALANCE
                >,
                position: y > nodeBound.y + nodeBound.h / 2 ? 'next' : 'prev',
              },
              path: mindmap.getPath(node),
            });
          } else {
            const operation = MindmapUtils.tryMoveNode(
              hoveredMindMap,
              hoveredNode,
              dragMindMapCtx.mindmap,
              dragMindMapCtx.node,
              [x, y],
              options => this._drawIndicator(options)
            );

            if (operation) {
              hoveredCtx.abort = operation.abort;
              hoveredCtx.merge = operation.merge;
            }
          }
        }
      },
      dragEnd: (e: PointerEventState) => {
        if (hoveredCtx?.merge) {
          hoveredCtx.merge();
        } else {
          hoveredCtx?.abort?.();

          if (hoveredCtx?.detach) {
            const [startX, startY] = this.gfx.viewport.toModelCoord(
              dragMindMapCtx.startPoint.x,
              dragMindMapCtx.startPoint.y
            );
            const [endX, endY] = this.gfx.viewport.toModelCoord(e.x, e.y);

            dragMindMapCtx.node.element.xywh =
              dragMindMapCtx.node.element.elementBound
                .moveDelta(endX - startX, endY - startY)
                .serialize();

            if (dragMindMapCtx.node !== dragMindMapCtx.mindmap.tree) {
              MindmapUtils.detachMindmap(
                dragMindMapCtx.mindmap,
                dragMindMapCtx.node
              );
              const mindmap = MindmapUtils.createFromTree(
                dragMindMapCtx.node,
                dragMindMapCtx.mindmap.style,
                dragMindMapCtx.mindmap.layoutType,
                this.gfx.surface!
              );

              mindmap.layout();
            } else {
              dragMindMapCtx.mindmap.layout();
            }
          }
        }

        hoveredCtx = null;
        dragMindMapCtx.clear?.();
        this._responseAreaUpdated.clear();
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

  private _drawIndicator(options: {
    targetMindMap: MindmapElementModel;
    target: MindmapNode;
    sourceMindMap: MindmapElementModel;
    source: MindmapNode;
    newParent: MindmapNode;
    insertPosition:
      | {
          type: 'sibling';
          layoutDir: Exclude<LayoutType, LayoutType.BALANCE>;
          position: 'prev' | 'next';
        }
      | { type: 'child'; layoutDir: Exclude<LayoutType, LayoutType.BALANCE> };
    path: number[];
  }) {
    const indicatorOverlay = this._indicatorOverlay;

    if (!indicatorOverlay) {
      return () => {};
    }

    // draw the indicator at given position
    const { newParent, insertPosition, targetMindMap, target, source, path } =
      options;
    const children = newParent.children.filter(
      node => node.element.id !== source.id
    );

    indicatorOverlay.setIndicatorInfo({
      targetMindMap,
      target,
      parent: newParent,
      insertPosition,
      parentChildren: children,
      path,
    });

    return () => {
      indicatorOverlay.clear();
    };
  }

  private _getHoveredMindMap(
    position: IVec,
    dragMindMapCtx: DragMindMapCtx
  ): MindmapElementModel | null {
    const mindmap =
      (this.gfx
        .getElementByPoint(position[0], position[1], {
          all: true,
          responsePadding: [NODE_HORIZONTAL_SPACING, NODE_VERTICAL_SPACING * 2],
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
        }) as MindmapElementModel) ?? null;

    if (
      mindmap &&
      (!this._responseAreaUpdated.has(mindmap) || !mindmap.tree.responseArea)
    ) {
      this._calcDragResponseArea(mindmap);
    }

    return mindmap;
  }

  private _setupDragNodeImage(
    mindmapNode: MindmapNode,
    event: PointerEventState
  ) {
    const surfaceBlock = this.gfx.surfaceComponent as SurfaceBlockComponent;
    const renderer = surfaceBlock?.renderer;
    const indicatorOverlay = this._indicatorOverlay;

    if (!renderer || !indicatorOverlay) {
      return;
    }

    const nodeBound = mindmapNode.element.elementBound;

    const pos = this.gfx.viewport.toModelCoord(event.x, event.y);
    const canvas = renderer.getCanvasByBound(
      mindmapNode.element.elementBound,
      [mindmapNode.element],
      undefined,
      undefined,
      false
    );

    indicatorOverlay.dragNodePos = [nodeBound.x - pos[0], nodeBound.y - pos[1]];
    indicatorOverlay.dragNodeImage = canvas;

    return () => {
      indicatorOverlay.dragNodeImage = null;
      indicatorOverlay.currentDragPos = null;
    };
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

    if (isSingleMindMapNode(dragState.movedElements)) {
      const mindmap = dragState.movedElements[0].group as MindmapElementModel;
      const mindmapNode = mindmap.getNode(dragState.movedElements[0].id)!;
      const mindmapBound = mindmap.elementBound;

      dragState.movedElements.splice(0, 1);

      mindmapBound.x -= NODE_HORIZONTAL_SPACING;
      mindmapBound.y -= NODE_VERTICAL_SPACING * 2;
      mindmapBound.w += NODE_HORIZONTAL_SPACING * 2;
      mindmapBound.h += NODE_VERTICAL_SPACING * 4;

      this._calcDragResponseArea(mindmap);

      const clearDragImage = this._setupDragNodeImage(
        mindmapNode,
        dragState.event
      );
      const clearOpacity = this._updateNodeOpacity(mindmap, mindmapNode);

      const mindMapDragCtx: DragMindMapCtx = {
        mindmap,
        node: mindmapNode,
        clear: () => {
          clearOpacity();
          clearDragImage?.();
          dragState.movedElements.push(mindmapNode.element);
        },
        originalMindMapBound: mindmapBound,
        startPoint: dragState.event,
      };

      return this._createManipulationHandlers(mindMapDragCtx);
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

import type {
  BaseElementProps,
  GfxModel,
  PointTestOptions,
  SerializedElement,
} from '@blocksuite/block-std/gfx';
import type { Bound, SerializedXYWH, XYWH } from '@blocksuite/global/utils';

import {
  convert,
  field,
  GfxGroupLikeElementModel,
  observe,
  watch,
} from '@blocksuite/block-std/gfx';
import {
  assertType,
  deserializeXYWH,
  keys,
  last,
  noop,
  pick,
} from '@blocksuite/global/utils';
import { DocCollection, type Y } from '@blocksuite/store';
import { generateKeyBetween } from 'fractional-indexing';
import { z } from 'zod';

import type { ConnectorStyle, MindmapStyleGetter } from './style.js';

import { LayoutType, MindmapStyle } from '../../consts/mindmap.js';
import { LocalConnectorElementModel } from '../connector/local-connector.js';
import { mindmapStyleGetters } from './style.js';
import { findInfiniteLoop } from './utils.js';

export type NodeDetail = {
  /**
   * The index of the node, it decides the layout order of the node
   */
  index: string;
  parent?: string;
};

export type MindmapNode = {
  id: string;
  detail: NodeDetail;

  element: BlockSuite.SurfaceElementModel;
  children: MindmapNode[];

  parent: MindmapNode | null;

  /**
   * This area is used to determine where to place the dragged node.
   *
   * When dragging another node into this area, it will become a sibling of the this node.
   * But if it is dragged into the small area located right after the this node, it will become a child of the this node.
   */
  responseArea?: Bound;

  /**
   * This property override the preferredDir or default layout direction.
   * It is used during dragging that would temporary change the layout direction
   */
  overriddenDir?: LayoutType;
};

export type MindmapRoot = MindmapNode & {
  left: MindmapNode[];
  right: MindmapNode[];
};

const baseNodeSchema = z.object({
  text: z.string(),
  xywh: z.optional(z.string()),
});

type Node = z.infer<typeof baseNodeSchema> & {
  children?: Node[];
};

const nodeSchema: z.ZodType<Node> = baseNodeSchema.extend({
  children: z.lazy(() => nodeSchema.array()).optional(),
});

export type NodeType = z.infer<typeof nodeSchema>;

function isNodeType(node: Record<string, unknown>): node is NodeType {
  return typeof node.text === 'string' && Array.isArray(node.children);
}

export type SerializedMindmapElement = SerializedElement & {
  children: Record<string, NodeDetail>;
};

type MindmapElementProps = BaseElementProps & {
  children: Y.Map<NodeDetail>;
};

function observeChildren(
  _: unknown,
  instance: MindmapElementModel,
  transaction: Y.Transaction | null
) {
  if (instance.children.doc) {
    instance.setChildIds(
      Array.from(instance.children.keys()),
      transaction?.local ?? true
    );

    instance.buildTree();
    instance.connectors.clear();
  }
}

function watchLayoutType(
  _: unknown,
  instance: MindmapElementModel,
  local: boolean
) {
  if (!local) {
    return;
  }

  instance.surface.doc.transact(() => {
    instance['_tree']?.children.forEach(child => {
      if (!instance.children.has(child.id)) {
        return;
      }

      instance.children.set(child.id, {
        index: child.detail.index,
        parent: child.detail.parent,
      });
    });
  });

  instance.buildTree();
}

function watchStyle(_: unknown, instance: MindmapElementModel, local: boolean) {
  if (!local) return;
  instance.layout();
}

export class MindmapElementModel extends GfxGroupLikeElementModel<MindmapElementProps> {
  private _nodeMap = new Map<string, MindmapNode>();

  private _queueBuildTree = false;

  private _queuedLayout = false;

  private _stashedNode = new Set<string>();

  private _tree!: MindmapRoot;

  connectors = new Map<string, LocalConnectorElementModel>();

  extraConnectors = new Map<string, LocalConnectorElementModel>();

  get nodeMap() {
    return this._nodeMap;
  }

  override get rotate() {
    return 0;
  }

  override set rotate(_: number) {}

  get styleGetter(): MindmapStyleGetter {
    return mindmapStyleGetters[this.style];
  }

  get tree() {
    return this._tree;
  }

  get type() {
    return 'mindmap';
  }

  static override propsToY(props: Record<string, unknown>) {
    if (
      props.children &&
      !isNodeType(props.children as Record<string, unknown>) &&
      !(props.children instanceof DocCollection.Y.Map)
    ) {
      const children: Y.Map<NodeDetail> = new DocCollection.Y.Map();

      keys(props.children).forEach(key => {
        const detail = pick<Record<string, unknown>, keyof NodeDetail>(
          props.children![key],
          ['index', 'parent']
        );
        children.set(key as string, detail as NodeDetail);
      });

      props.children = children;
    }

    return props as MindmapElementProps;
  }

  private _cfgBalanceLayoutDir() {
    if (this.layoutType !== LayoutType.BALANCE) {
      return;
    }

    const tree = this._tree;
    const splitPoint = Math.ceil(tree.children.length / 2);

    tree.right.push(...tree.children.slice(0, splitPoint));
    tree.left.push(...tree.children.slice(splitPoint));
    tree.left.reverse();
  }

  private _isConnectorOutdated(
    options: {
      connector: LocalConnectorElementModel;
      from: MindmapNode;
      to: MindmapNode;
      layout: LayoutType;
    },
    updateKey: boolean = true
  ) {
    const { connector, from, to, layout } = options;

    if (!from.element || !to.element) {
      return { outdated: true, cacheKey: '' };
    }

    const cacheKey = `${from.element.xywh}-${to.element.xywh}-${layout}-${this.style}`;

    // @ts-ignore
    if (connector['MINDMAP_CONNECTOR'] === cacheKey) {
      return { outdated: false, cacheKey };
    } else if (updateKey) {
      // @ts-ignore
      connector['MINDMAP_CONNECTOR'] = cacheKey;
    }

    return { outdated: true, cacheKey };
  }

  protected override _getXYWH(): Bound {
    return super._getXYWH();
  }

  /**
   * @deprecated
   * you should not call this method directly
   */
  addChild(_element: GfxModel) {
    noop();
  }

  protected addConnector(
    from: MindmapNode,
    to: MindmapNode,
    layout: LayoutType,
    connectorStyle: ConnectorStyle,
    extra: boolean = false
  ) {
    const id = `#${from.id}-${to.id}`;

    if (extra) {
      this.extraConnectors.set(id, new LocalConnectorElementModel());
    } else if (this.connectors.has(id)) {
      const connector = this.connectors.get(id)!;
      const { outdated } = this._isConnectorOutdated({
        connector,
        from,
        to,
        layout,
      });

      if (!outdated) {
        return connector;
      }
    } else {
      const connector = new LocalConnectorElementModel();
      // update cache key
      this._isConnectorOutdated({
        connector,
        from,
        to,
        layout,
      });
      this.connectors.set(id, connector);
    }

    const connector = extra
      ? this.extraConnectors.get(id)!
      : this.connectors.get(id)!;

    connector.id = id;
    connector.source = {
      id: from.id,
      position: layout === LayoutType.RIGHT ? [1, 0.5] : [0, 0.5],
    };
    connector.target = {
      id: to.id,
      position: layout === LayoutType.RIGHT ? [0, 0.5] : [1, 0.5],
    };

    Object.entries(connectorStyle).forEach(([key, value]) => {
      // @ts-ignore
      connector[key as unknown] = value;
    });

    return connector;
  }

  addNode(
    /**
     * The parent node id of the new node. If it's null, the node will be the root node
     */
    parent: string | MindmapNode | null,
    sibling?: string | number,
    position: 'before' | 'after' = 'after',
    props: Record<string, unknown> = {}
  ) {
    if (parent && typeof parent !== 'string') {
      parent = parent.id;
    }

    assertType<string | null>(parent);

    if (parent && !this._nodeMap.has(parent)) {
      throw new Error(`Parent node ${parent} not found`);
    }

    props['text'] = new DocCollection.Y.Text(
      (props['text'] as string) ?? 'New node'
    );

    const type = (props.type as string) ?? 'shape';
    let id: string;
    this.surface.doc.transact(() => {
      const parentNode = parent ? this._nodeMap.get(parent)! : null;

      if (parentNode) {
        let index = last(parentNode.children)
          ? generateKeyBetween(last(parentNode.children)!.detail.index, null)
          : 'a0';

        sibling = sibling ?? last(parentNode.children)?.id;
        const siblingNode =
          typeof sibling === 'number'
            ? parentNode.children[sibling]
            : sibling
              ? this._nodeMap.get(sibling)
              : undefined;
        const path = siblingNode
          ? this.getPath(siblingNode)
          : this.getPath(parentNode).concat([0]);
        const style = this.styleGetter.getNodeStyle(
          siblingNode ?? parentNode,
          path
        );

        id = this.surface.addElement({
          type,
          xywh: '[0,0,100,30]',
          maxWidth: false,
          ...props,
          ...style.node,
        });

        if (siblingNode) {
          const siblingIndex = parentNode.children.findIndex(
            val => val.id === sibling
          );

          index =
            position === 'after'
              ? generateKeyBetween(
                  siblingNode.detail.index,
                  parentNode.children[siblingIndex + 1]?.detail.index ?? null
                )
              : generateKeyBetween(
                  parentNode.children[siblingIndex - 1]?.detail.index ?? null,
                  siblingNode.detail.index
                );
        }

        const nodeDetail: NodeDetail = {
          index,
          parent: parent!,
        };

        this.children.set(id, nodeDetail);
      } else {
        const rootStyle = this.styleGetter.root;

        id = this.surface.addElement({
          type,
          xywh: '[0,0,113,41]',
          maxWidth: false,
          ...props,
          ...rootStyle,
        });

        this.children.clear();
        this.children.set(id, {
          index: 'a0',
        });
      }
    });
    this.layout();

    return id!;
  }

  buildTree() {
    const mindmapNodeMap = new Map<string, MindmapNode>();
    const nodesMap = this.children;

    // The element may be removed
    if (!nodesMap || nodesMap.size === 0) {
      this._nodeMap = mindmapNodeMap;
      // @ts-ignore
      this._tree = null;
      return;
    }

    let rootNode: MindmapRoot | undefined;

    nodesMap.forEach((val, id) => {
      if (!mindmapNodeMap.has(id)) {
        mindmapNodeMap.set(id, {
          id,
          index: val.index,
          detail: val,
          element: this.surface.getElementById(id)!,
          children: [],
          parent: null,
        } as MindmapNode);
      }

      const node = mindmapNodeMap.get(id)!;

      // some node may be already created during
      // iterating its children
      if (!node.detail) {
        node.detail = val;
      }

      if (!val.parent) {
        rootNode = node as MindmapRoot;
        rootNode.left = [];
        rootNode.right = [];
      } else {
        if (!mindmapNodeMap.has(val.parent)) {
          mindmapNodeMap.set(val.parent, {
            id: val.parent,
            detail: nodesMap.get(val.parent)!,
            parent: null,
            children: [],
            element: this.surface.getElementById(val.parent)!,
          } as MindmapNode);
        }

        const parent = mindmapNodeMap.get(val.parent)!;
        parent.children.push(node);
        node.parent = parent;
      }
    });

    mindmapNodeMap.forEach(node => {
      node.children.sort((a, b) =>
        a.detail.index === b.detail.index
          ? 0
          : a.detail.index > b.detail.index
            ? 1
            : -1
      );
    });

    if (!rootNode) {
      return;
    }

    const loops = findInfiniteLoop(rootNode, mindmapNodeMap);

    if (loops.length) {
      this.surface.doc.withoutTransact(() => {
        loops.forEach(loop => {
          if (loop.detached) {
            loop.chain.forEach(node => {
              this.children.delete(node.id);
            });
          } else {
            const child = last(loop.chain);

            if (child) {
              this.children.set(child.id, {
                index: child.detail.index,
              });
            }
          }
        });
      });
      return;
    }

    this._nodeMap = mindmapNodeMap;
    this._tree = rootNode;

    if (this.layoutType === LayoutType.BALANCE) {
      this._cfgBalanceLayoutDir();
    } else {
      this._tree[this.layoutType === LayoutType.RIGHT ? 'right' : 'left'] =
        this._tree.children;
    }
  }

  /**
   *
   * @param subtree The subtree of root, this only take effects when the layout type is BALANCED.
   * @returns
   */
  getChildNodes(id: string, subtree?: 'left' | 'right') {
    const node = this._nodeMap.get(id);

    if (!node) {
      return [];
    }

    if (subtree && id === this._tree.id) {
      return this._tree[subtree];
    }

    return node.children;
  }

  getConnector(from: MindmapNode, to: MindmapNode) {
    if (!this._nodeMap.has(from.id) || !this._nodeMap.has(to.id)) {
      return null;
    }

    return this.addConnector(
      from,
      to,
      this.getLayoutDir(to)!,
      this.styleGetter.getNodeStyle(to, this.getPath(to)).connector
    );
  }

  getLayoutDir(node: string | MindmapNode): LayoutType {
    node = typeof node === 'string' ? this._nodeMap.get(node)! : node;

    assertType<MindmapNode>(node);

    let current: MindmapNode | null = node;
    const root = this._tree;

    while (current) {
      if (current.overriddenDir !== undefined) {
        return current.overriddenDir;
      }

      const parent: MindmapNode | null = current.detail.parent
        ? (this._nodeMap.get(current.detail.parent) ?? null)
        : null;

      if (parent === root) {
        return (
          parent.overriddenDir ??
          (root.left.includes(current)
            ? LayoutType.LEFT
            : root.right.includes(current)
              ? LayoutType.RIGHT
              : this.layoutType)
        );
      }

      current = parent;
    }

    return this.layoutType;
  }

  getNode(id: string) {
    return this._nodeMap.get(id) ?? null;
  }

  getParentNode(id: string) {
    const node = this.children.get(id);

    return node?.parent ? (this._nodeMap.get(node.parent) ?? null) : null;
  }

  /**
   * Path is an array of indexes that represent the path from the root node to the target node.
   * The first element of the array is always 0, which represents the root node.
   * @param element
   * @returns
   *
   * @example
   * ```ts
   * const path = mindmap.getPath('nodeId');
   * // [0, 1, 2]
   * ```
   */
  getPath(element: string | MindmapNode) {
    let node = this._nodeMap.get(
      typeof element === 'string' ? element : element.id
    );

    if (!node) {
      throw new Error('Node not found');
    }

    const path: number[] = [];

    while (node && node !== this._tree) {
      const parent = this._nodeMap.get(node!.detail.parent!);

      path.unshift(parent!.children.indexOf(node!));
      node = parent;
    }

    path.unshift(0);

    return path;
  }

  getSiblingNode(
    id: string,
    direction: 'prev' | 'next' = 'next',
    /**
     * The subtree of which that the sibling node belongs to,
     * this is used when the layout type is BALANCED.
     */
    subtree?: 'left' | 'right'
  ) {
    const node = this._nodeMap.get(id);

    if (!node) {
      return null;
    }

    const parent = this._nodeMap.get(node.detail.parent!);

    if (!parent) {
      return null;
    }

    const childrenTree =
      subtree && parent.id === this._tree.id
        ? this._tree[subtree]
        : parent.children;
    const idx = childrenTree.indexOf(node);
    if (idx === -1) {
      return null;
    }
    const siblingIndex = direction === 'next' ? idx + 1 : idx - 1;
    const sibling = childrenTree[siblingIndex] ?? null;

    return sibling;
  }

  override includesPoint(x: number, y: number, options: PointTestOptions) {
    const bound = this.elementBound;

    bound.x -= options.responsePadding?.[0] ?? 0;
    bound.w += (options.responsePadding?.[0] ?? 0) * 2;
    bound.y -= options.responsePadding?.[1] ?? 0;
    bound.h += (options.responsePadding?.[1] ?? 0) * 2;

    return bound.containsPoint([x, y]);
  }

  layout(
    _tree: MindmapNode | MindmapRoot = this.tree,
    _options: {
      applyStyle?: boolean;
      layoutType?: LayoutType;
      calculateTreeBound?: boolean;
      stashed?: boolean;
    } = {
      applyStyle: true,
      calculateTreeBound: true,
      stashed: true,
    }
  ) {
    // should be override by subclass
  }

  moveTo(targetXYWH: SerializedXYWH | XYWH) {
    const { x, y } = this;
    const targetPos =
      typeof targetXYWH === 'string' ? deserializeXYWH(targetXYWH) : targetXYWH;
    const offsetX = targetPos[0] - x;
    const offsetY = targetPos[1] - y + targetPos[3];

    this.surface.doc.transact(() => {
      this.childElements.forEach(el => {
        const deserializedXYWH = deserializeXYWH(el.xywh);

        el.xywh =
          `[${deserializedXYWH[0] + offsetX},${deserializedXYWH[1] + offsetY},${deserializedXYWH[2]},${deserializedXYWH[3]}]` as SerializedXYWH;
      });
    });
  }

  override onCreated(): void {
    this.requestBuildTree();
  }

  removeChild(element: GfxModel) {
    if (!this._nodeMap.has(element.id)) {
      return;
    }

    const surface = this.surface;
    const removedDescendants: string[] = [];
    const remove = (node: MindmapNode) => {
      node.children?.forEach(child => {
        remove(child);
      });

      this.children?.delete(node.id);
      removedDescendants.push(node.id);
    };

    surface.doc.transact(() => {
      remove(this._nodeMap.get(element.id)!);
    });

    queueMicrotask(() => {
      removedDescendants.forEach(id => surface.deleteElement(id));
    });

    // This transaction may not end
    // force to build the elements
    this.buildTree();
    this.requestLayout();
  }

  protected requestBuildTree() {
    if (this._queueBuildTree) {
      return;
    }

    this._queueBuildTree = true;
    queueMicrotask(() => {
      this.buildTree();
      this._queueBuildTree = false;
    });
  }

  requestLayout() {
    if (!this._queuedLayout) {
      this._queuedLayout = true;

      queueMicrotask(() => {
        this.layout();
        this._queuedLayout = false;
      });
    }
  }

  override serialize() {
    const result = super.serialize();
    return result as SerializedMindmapElement;
  }

  /**
   * Stash mind map node and its children's xywh property
   * @param node
   * @returns a function that write back the stashed xywh into yjs
   */
  stashTree(node: MindmapNode | string) {
    const mindNode = typeof node === 'string' ? this.getNode(node) : node;

    if (!mindNode || this._stashedNode.has(mindNode.id)) {
      return;
    }

    const stashed = new Set<BlockSuite.SurfaceElementModel>();
    const traverse = (node: MindmapNode) => {
      node.element.stash('xywh');
      stashed.add(node.element);

      if (node.children.length) {
        node.children.forEach(child => traverse(child));
      }
    };

    traverse(mindNode);

    return () => {
      this._stashedNode.delete(mindNode.id);
      stashed.forEach(el => {
        el.pop('xywh');
      });
    };
  }

  traverse(callback: (node: MindmapNode, parent: MindmapNode | null) => void) {
    const traverse = (node: MindmapNode, parent: MindmapNode | null) => {
      callback(node, parent);

      node?.children.forEach(child => {
        traverse(child, node);
      });
    };

    if (this._tree) {
      traverse(this._tree, null);
    }
  }

  @convert((initialValue, instance) => {
    if (!(initialValue instanceof DocCollection.Y.Map)) {
      nodeSchema.parse(initialValue);

      assertType<NodeType>(initialValue);

      const map: Y.Map<NodeDetail> = new DocCollection.Y.Map();
      const surface = instance.surface;
      const doc = surface.doc;
      const recursive = (
        node: NodeType,
        parent: string | null = null,
        index: string = 'a0'
      ) => {
        const id = surface.addElement({
          type: 'shape',
          text: node.text,
          xywh: node.xywh ? node.xywh : `[0, 0, 100, 30]`,
        });

        map.set(id, {
          index,
          parent: parent ?? undefined,
        });

        let curIdx = 'a0';
        node.children?.forEach(childNode => {
          recursive(childNode, id, curIdx);
          curIdx = generateKeyBetween(curIdx, null);
        });
      };

      doc.transact(() => {
        recursive(initialValue);
      });

      instance.requestBuildTree();
      instance.requestLayout();
      return map;
    } else {
      instance.requestBuildTree();
      instance.requestLayout();
      return initialValue;
    }
  })
  // Use extracted function to avoid playwright test failure
  // since this model package is imported by playwright
  @observe(observeChildren)
  @field()
  accessor children: Y.Map<NodeDetail> = new DocCollection.Y.Map();

  @watch(watchLayoutType)
  @field()
  accessor layoutType: LayoutType = LayoutType.RIGHT;

  @watch(watchStyle)
  @field()
  accessor style: MindmapStyle = MindmapStyle.ONE;
}

declare global {
  namespace BlockSuite {
    interface SurfaceGroupLikeModelMap {
      mindmap: MindmapElementModel;
    }
  }
}

import { assertType } from '@blocksuite/global/utils';
import { DocCollection, type Y } from '@blocksuite/store';
import { generateKeyBetween } from 'fractional-indexing';
import { z } from 'zod';

import { keys, last, pick } from '../../_common/utils/iterable.js';
import { TextResizing } from '../consts.js';
import { ConnectorPathGenerator } from '../managers/connector-manager.js';
import type { SurfaceBlockModel } from '../surface-model.js';
import {
  deserializeXYWH,
  type SerializedXYWH,
  type XYWH,
} from '../utils/xywh.js';
import {
  type IBaseProps,
  type SerializedElement,
  SurfaceGroupLikeModel,
} from './base.js';
import { LocalConnectorElementModel } from './connector.js';
import { convert, observe, watch, yfield } from './decorators.js';
import type {
  MindmapNode,
  MindmapRoot,
  NodeDetail,
} from './utils/mindmap/layout.js';
import { layout, LayoutType } from './utils/mindmap/layout.js';
import type {
  ConnectorStyle,
  MindmapStyleGetter,
} from './utils/mindmap/style.js';
import {
  applyNodeStyle,
  MindmapStyle,
  mindmapStyleGetters,
} from './utils/mindmap/style.js';

export { LayoutType } from './utils/mindmap/layout.js';
export { MindmapStyle } from './utils/mindmap/style.js';

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

type NodeType = z.infer<typeof nodeSchema>;

function isNodeType(node: Record<string, unknown>): node is NodeType {
  return typeof node.text === 'string' && Array.isArray(node.children);
}

export type SerializedMindmapElement = SerializedElement & {
  children: Record<string, NodeDetail>;
};

type MindmapElementProps = IBaseProps & {
  children: Y.Map<NodeDetail>;
};

export class MindmapElementModel extends SurfaceGroupLikeModel<MindmapElementProps> {
  get type() {
    return 'mindmap';
  }

  get tree() {
    return this._tree;
  }

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

  private _tree!: MindmapRoot;

  private _nodeMap = new Map<string, MindmapNode>();

  private _queueBuildTree = false;

  private _queued = false;

  pathGenerator: ConnectorPathGenerator = new ConnectorPathGenerator({
    getElementById: (id: string) =>
      this.surface.getElementById(id) ??
      (this.surface.doc.getBlockById(id) as BlockSuite.EdgelessModelType),
  });

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
  @observe(
    (_, instance: MindmapElementModel, transaction: Y.Transaction | null) => {
      instance.setChildIds(
        Array.from(instance.children.keys()),
        transaction?.local ?? true
      );

      instance.buildTree();
      instance.connectors.clear();
    }
  )
  @yfield()
  accessor children: Y.Map<NodeDetail> = new DocCollection.Y.Map();

  @watch((_, instance: MindmapElementModel, local) => {
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
  })
  @yfield()
  accessor layoutType: LayoutType = LayoutType.RIGHT;

  @watch((_, instance: MindmapElementModel, local) => {
    if (local) {
      instance.layout();
    }
  })
  @yfield()
  accessor style: MindmapStyle = MindmapStyle.ONE;

  connectors = new Map<string, LocalConnectorElementModel>();

  extraConnectors = new Map<string, LocalConnectorElementModel>();

  private _cfgBalanceLayoutDir() {
    if (this.layoutType !== LayoutType.BALANCE) {
      return;
    }

    const tree = this._tree;
    const splitPoint = tree.children.findIndex((child, index) => {
      if (
        child.detail.preferredDir === LayoutType.LEFT ||
        (child.detail.preferredDir === LayoutType.RIGHT &&
          child.children[index + 1]?.detail.preferredDir !== LayoutType.RIGHT)
      ) {
        return true;
      }

      return false;
    });

    if (splitPoint === -1) {
      const mid = Math.ceil(tree.children.length / 2);

      tree.right.push(...tree.children.slice(0, mid));
      tree.left.push(...tree.children.slice(mid));
    } else {
      tree.right.push(...tree.children.slice(0, splitPoint + 1));
      tree.left.push(...tree.children.slice(splitPoint + 1));
    }

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

  protected buildTree() {
    const mindmapNodeMap = new Map<string, MindmapNode>();
    const nodesMap = this.children;

    // The element may be removed
    if (!nodesMap) {
      this._nodeMap = mindmapNodeMap;
      // @ts-ignore
      this._tree = null;
      return;
    }

    let rootNode: MindmapRoot | undefined;

    nodesMap.forEach((val, id) => {
      const node = mindmapNodeMap.has(id)
        ? mindmapNodeMap.get(id)!
        : ({
            id,
            parent: val.parent,
            index: val.index,
            detail: val,
            element: this.surface.getElementById(id)!,
            children: [],
          } as MindmapNode);

      if (!node.detail) {
        node.detail = val;
      }

      if (!mindmapNodeMap.has(id)) {
        mindmapNodeMap.set(id, node);
      }

      if (!val.parent) {
        rootNode = node as MindmapRoot;
        rootNode.left = [];
        rootNode.right = [];
      } else if (mindmapNodeMap.has(val.parent)) {
        const parentNode = mindmapNodeMap.get(val.parent)!;
        parentNode.children = parentNode.children ?? [];
        parentNode.children.push(node);
      } else {
        mindmapNodeMap.set(val.parent, {
          id: val.parent,
          children: [node],
          element: this.surface.getElementById(val.parent)!,
        } as MindmapNode);
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

    this._nodeMap = mindmapNodeMap;
    this._tree = rootNode;

    if (this.layoutType === LayoutType.BALANCE) {
      this._cfgBalanceLayoutDir();
    } else {
      this._tree[this.layoutType === LayoutType.RIGHT ? 'right' : 'left'] =
        this._tree.children;
    }
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

    this.pathGenerator.updatePath(connector);

    return connector;
  }

  override onCreated(): void {
    this.requestBuildTree();
  }

  override serialize() {
    const result = super.serialize();
    return result as SerializedMindmapElement;
  }

  getParentNode(id: string) {
    const node = this.children.get(id);

    return node?.parent ? this._nodeMap.get(node.parent) ?? null : null;
  }

  getNode(id: string) {
    return this._nodeMap.get(id) ?? null;
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

  addNode(
    /**
     * The parent node id of the new node. If it's null, the node will be the root node
     */
    parent: string | MindmapNode | null,
    sibling?: string | number,
    position: 'before' | 'after' = 'after',
    props: Record<string, unknown> = {},

    /**
     * Force the layout direction of the node.
     * It only works on the first level node with the layout type of BALANCE
     */
    direction?: LayoutType.LEFT | LayoutType.RIGHT
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
        const isBalance =
          this.layoutType === LayoutType.BALANCE &&
          this._tree.id === parentNode.id;

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
          textResizing: TextResizing.AUTO_WIDTH,
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
        } else if (isBalance && direction !== undefined) {
          const lastNode =
            direction === LayoutType.LEFT
              ? this._tree.left[0]
              : last(this._tree.right);

          if (lastNode) {
            index = generateKeyBetween(lastNode.detail.index, null);
          }
        }

        const nodeDetail: NodeDetail = {
          index,
          parent: parent!,
        };

        if (direction !== undefined && isBalance) {
          nodeDetail.preferredDir = direction;
        }

        this.children.set(id, nodeDetail);
      } else {
        const rootStyle = this.styleGetter.root;

        id = this.surface.addElement({
          type,
          xywh: '[0,0,113,41]',
          textResizing: TextResizing.AUTO_WIDTH,
          maxWidth: 400,
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

  moveTree(
    tree: MindmapNode,
    parent: string | MindmapNode,
    siblingIndex: number,
    layout?: LayoutType
  ) {
    parent = this._nodeMap.get(
      typeof parent === 'string' ? parent : parent.id
    )!;

    if (!parent || !this._nodeMap.has(tree.id)) {
      return;
    }

    assertType<MindmapNode>(parent);

    if (layout === LayoutType.BALANCE || parent !== this._tree) {
      layout = undefined;
    }

    const sibling = parent.children[siblingIndex];
    const preSibling = parent.children[siblingIndex - 1];
    const index =
      sibling || preSibling
        ? generateKeyBetween(
            preSibling?.detail.index ?? null,
            sibling?.detail.index ?? null
          )
        : tree.detail.index ?? undefined;

    this.surface.doc.transact(() => {
      const val: NodeDetail =
        layout !== undefined
          ? {
              ...tree.detail,
              index,
              parent: parent.id,
              preferredDir: layout,
            }
          : {
              ...tree.detail,
              index,
              parent: parent.id,
            };

      this.children.set(tree.id, val);
    });

    this.layout();

    return this._nodeMap.get(tree.id);
  }

  addTree(
    parent: string | MindmapNode,
    tree: NodeType | MindmapNode,
    /**
     * `sibling` indicates where to insert a subtree among peer elements.
     * If it's a string, it represents a peer element's ID;
     * if it's a number, it represents its index.
     * The subtree will be inserted before the sibling element.
     */
    sibling?: string | number,

    /**
     * Preferred layout direction, only works when parent is root and layout type is BALANCE
     */
    layout?: LayoutType
  ) {
    parent = typeof parent === 'string' ? parent : parent.id;

    if (!this._nodeMap.has(parent) || !parent) {
      return null;
    }

    assertType<string>(parent);

    if (
      layout === LayoutType.BALANCE ||
      this._nodeMap.get(parent) !== this._tree
    ) {
      layout = undefined;
    }

    const traverse = (
      node: NodeType | MindmapNode,
      parent: string,
      sibling?: string | number,
      layout?: LayoutType.LEFT | LayoutType.RIGHT
    ) => {
      let nodeId: string;
      if ('text' in node) {
        nodeId = this.addNode(
          parent,
          sibling,
          'before',
          {
            text: node.text,
          },
          layout
        );
      } else {
        this.children.set(node.id, {
          ...node.detail,
          parent,
        });
        nodeId = node.id;
      }

      node.children?.forEach(child => {
        traverse(child, nodeId);
      });

      return nodeId;
    };

    if (!('text' in tree)) {
      // Modify the children ymap directly hence need transaction
      this.surface.doc.transact(() => {
        traverse(tree, parent, sibling, layout);
      });

      this.applyStyle();
      this.layout();

      return this._nodeMap.get(tree.id);
    } else {
      const nodeId = traverse(tree, parent, sibling, layout);

      this.layout();

      return this._nodeMap.get(nodeId);
    }
  }

  stashTree(node: MindmapNode | string) {
    const mindNode = typeof node === 'string' ? this.getNode(node) : node;

    if (!mindNode) {
      return;
    }

    const stashed = new Set<
      BlockSuite.SurfaceElementModelType | LocalConnectorElementModel
    >();
    const traverse = (node: MindmapNode, parent: MindmapNode | null) => {
      node.element.stash('xywh');
      node.element.opacity = 0.3;
      stashed.add(node.element);

      if (parent) {
        const connectorId = `#${parent.element.id}-${node.element.id}`;
        const connector = this.connectors.get(connectorId);

        if (connector) {
          connector.opacity = 0.3;
          stashed.add(connector);
        }
      }

      if (node.children.length) {
        node.children.forEach(child => traverse(child, node));
      }
    };

    const parent = this.getParentNode(mindNode.element.id);
    const parentNode = parent ? this.getNode(parent.id) : null;

    traverse(mindNode, parentNode);

    return () => {
      stashed.forEach(el => {
        if ('pop' in el) {
          el.pop('xywh');
        }

        el.opacity = 1;
      });
    };
  }

  removeChild(id: string) {
    if (!this._nodeMap.has(id)) {
      return;
    }

    const surface = this.surface;
    const removedDescendants: string[] = [];
    const remove = (element: MindmapNode) => {
      element.children?.forEach(child => {
        remove(child);
      });

      this.children?.delete(element.id);
      removedDescendants.push(element.id);
    };

    surface.doc.transact(() => {
      remove(this._nodeMap.get(id)!);
    });

    queueMicrotask(() => {
      removedDescendants.forEach(id => surface.removeElement(id));
    });

    // This transaction may not end
    // force to build the elements
    this.buildTree();
    this.requestLayout();
  }

  layout(
    tree: MindmapNode | MindmapRoot = this.tree,
    applyStyle = true,
    layoutType?: LayoutType
  ) {
    if (!tree || !tree.element) return;

    if (applyStyle) {
      this.applyStyle(true);
    }

    this.surface.doc.transact(() => {
      const path = this.getPath(tree.id);
      layout(tree, this, layoutType ?? this.getLayoutDir(tree.id), path);
    });
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

  getLayoutDir(node: string | MindmapNode): LayoutType | null {
    node = typeof node === 'string' ? this._nodeMap.get(node)! : node;

    assertType<MindmapNode>(node);

    let current: MindmapNode | null = node;
    const root = this._tree;

    while (current) {
      if (current.overriddenDir !== undefined) {
        return current.overriddenDir;
      }

      const parent: MindmapNode | null = current.detail.parent
        ? this._nodeMap.get(current.detail.parent) ?? null
        : null;

      if (parent === root) {
        return root.left.includes(current)
          ? LayoutType.LEFT
          : root.right.includes(current)
            ? LayoutType.RIGHT
            : this.layoutType;
      }

      current = parent;
    }

    return this.layoutType;
  }

  requestLayout() {
    if (!this._queued) {
      this._queued = true;

      queueMicrotask(() => {
        this.layout();
        this._queued = false;
      });
    }
  }

  applyStyle(fitContent: boolean = false) {
    this.surface.doc.transact(() => {
      const style = this.styleGetter;
      if (!style) return;
      applyNodeStyle(this._tree, style.root, fitContent);

      const walk = (node: MindmapNode, path: number[]) => {
        node.children.forEach((child, idx) => {
          const currentPath = [...path, idx];
          const nodeStyle = style.getNodeStyle(child, currentPath);

          applyNodeStyle(child, nodeStyle.node, fitContent);

          walk(child, currentPath);
        });
      };

      walk(this._tree, [0]);
    });
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

  /**
   * Detach a mindmap. It is similar to `removeChild` but
   * it does not delete the node.
   *
   * So the node can be used to create a new mind map or merge into other mind map
   */
  detach(subtree: string | MindmapNode) {
    subtree =
      typeof subtree === 'string' ? this._nodeMap.get(subtree)! : subtree;

    assertType<MindmapNode>(subtree);

    if (!subtree) {
      return;
    }

    const traverse = (subtree: MindmapNode) => {
      this.children.delete(subtree.id);

      // cut the reference inside the ymap
      subtree.detail = {
        ...subtree.detail,
      };

      subtree.children.forEach(child => traverse(child));
    };

    this.surface.doc.transact(() => {
      traverse(subtree);
    });

    this.layout();

    delete subtree.detail.parent;

    return subtree;
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
          ['index', 'parent', 'preferredDir']
        );
        children.set(key as string, detail as NodeDetail);
      });

      props.children = children;
    }

    return props as MindmapElementProps;
  }

  static createFromTree(
    tree: MindmapNode,
    style: MindmapStyle,
    layoutType: LayoutType,
    surface: SurfaceBlockModel
  ) {
    const children = new DocCollection.Y.Map();
    const traverse = (subtree: MindmapNode, parent?: string) => {
      const value: NodeDetail = {
        ...subtree.detail,
        parent,
      };

      if (!parent) {
        delete value.parent;
      }

      children.set(subtree.id, value);

      subtree.children.forEach(child => traverse(child, subtree.id));
    };

    traverse(tree);

    const mindmapId = surface.addElement({
      type: 'mindmap',
      children,
      layoutType,
      style,
    });
    const mindmap = surface.getElementById(mindmapId) as MindmapElementModel;

    mindmap.layout();

    return mindmap;
  }
}

declare global {
  namespace BlockSuite {
    interface SurfaceGroupLikeModelMap {
      mindmap: MindmapElementModel;
    }
  }
}

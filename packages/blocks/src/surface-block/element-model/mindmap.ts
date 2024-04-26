import { assertType } from '@blocksuite/global/utils';
import { DocCollection, type Y } from '@blocksuite/store';
import { generateKeyBetween } from 'fractional-indexing';
import { z } from 'zod';

import type { EdgelessModel } from '../../_common/types.js';
import { last } from '../../_common/utils/iterable.js';
import { ConnectorPathGenerator } from '../managers/connector-manager.js';
import {
  deserializeXYWH,
  type SerializedXYWH,
  type XYWH,
} from '../utils/xywh.js';
import { type BaseProps, GroupLikeModel } from './base.js';
import { TextResizing } from './common.js';
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
  applyConnectorStyle,
  applyNodeStyle,
  MindmapStyle,
  mindmapStyleGetters,
} from './utils/mindmap/style.js';

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

type MindmapElementProps = BaseProps & {
  nodes: Y.Map<NodeDetail>;
};

export class MindmapElementModel extends GroupLikeModel<MindmapElementProps> {
  get type() {
    return 'mindmap';
  }

  override onCreated(): void {
    this.buildTree();
    this.layout();
  }

  pathGenerator: ConnectorPathGenerator = new ConnectorPathGenerator({
    getElementById: (id: string) =>
      this.surface.getElementById(id) ??
      (this.surface.doc.getBlockById(id) as EdgelessModel),
  });

  @convert((initalValue, instance) => {
    if (!(initalValue instanceof DocCollection.Y.Map)) {
      nodeSchema.parse(initalValue);

      assertType<NodeType>(initalValue);

      const map = new DocCollection.Y.Map() as MindmapElementProps['nodes'];
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
        recursive(initalValue);
      });

      return map;
    } else {
      return initalValue;
    }
  })
  @observe(
    (_, instance: MindmapElementModel, transaction: Y.Transaction | null) => {
      instance.setChildIds(
        Array.from(instance.children.keys()),
        transaction?.local ?? true
      );
    }
  )
  @yfield()
  children: Y.Map<NodeDetail> = new DocCollection.Y.Map();

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

      instance.buildTree();
      instance.layout();
    });
  })
  @yfield()
  layoutType: LayoutType = LayoutType.BALANCE;

  @watch((_, instance: MindmapElementModel, local) => {
    if (local) {
      instance.applyStyle();
    }
  })
  @yfield()
  style: MindmapStyle = MindmapStyle.FOUR;

  connectors: Map<string, LocalConnectorElementModel> = new Map();

  private _tree!: MindmapRoot;

  private _nodeMap = new Map<string, MindmapNode>();

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

  protected buildTree() {
    const mindmapNodeMap = new Map<string, MindmapNode>();
    const nodesMap = this.children;
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

      if (mindmapNodeMap.has(id)) {
        node.detail = val;
      } else {
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
        a.detail.index.localeCompare(b.detail.index)
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

  private _cfgBalanceLayoutDir() {
    if (this.layoutType !== LayoutType.BALANCE) {
      return;
    }

    const tree = this._tree;

    tree.children.forEach(child => {
      if (child.detail.preferedDir === LayoutType.LEFT) {
        tree.left.push(child);
      } else if (child.detail.preferedDir === LayoutType.RIGHT) {
        tree.right.push(child);
      } else {
        tree.right.length <= tree.left.length
          ? tree.right.push(child)
          : tree.left.push(child);
      }
    });
  }

  getParentNode(id: string) {
    const node = this.children.get(id);

    return node?.parent ? this.surface.getElementById(node.parent) : null;
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
  private _getPath(element: string | MindmapNode) {
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

  addNode(
    /**
     * The parent node id of the new node. If it's null, the node will be the root node
     */
    parent: string | null,
    type: 'shape',
    sibling?: string,
    position: 'before' | 'after' = 'after',
    props: Record<string, unknown> = {},

    /**
     * Force the layout direction of the node.
     * It only works on the first level node with the layout type of BALANCE
     */
    direction?: LayoutType.LEFT | LayoutType.RIGHT
  ) {
    if (parent && !this._nodeMap.has(parent)) {
      throw new Error(`Parent node ${parent} not found`);
    }

    props['text'] = new DocCollection.Y.Text(
      (props['text'] as string) ?? 'New node'
    );

    let id: string;
    this.surface.doc.transact(() => {
      const parentNode = parent ? this._nodeMap.get(parent)! : null;

      if (parentNode) {
        let index = 'a0';

        sibling = sibling ?? last(parentNode.children)?.id;
        const siblingNode = sibling ? this._nodeMap.get(sibling) : undefined;
        const path = siblingNode
          ? this._getPath(siblingNode)
          : this._getPath(parentNode).concat([0]);
        const style = this.styleGetter.getNodeStyle(
          siblingNode ?? parentNode,
          path
        );

        id = this.surface.addElement({
          type,
          xywh: '[0,0,100,30]',
          textResizing: TextResizing.AUTO_WIDTH,
          maxWidth: 400,
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

        if (
          direction !== undefined &&
          this.layoutType === LayoutType.BALANCE &&
          parentNode.id === this._tree.id
        ) {
          nodeDetail.preferedDir = direction;
        }

        this.children.set(id, nodeDetail);
      } else {
        const rootStyle = this.styleGetter.root;

        id = this.surface.addElement({
          type,
          xywh: '[0,0,100,30]',
          textResizing: TextResizing.AUTO_WIDTH,
          maxWidth: 400,
          ...props,
          ...rootStyle,
        });

        this.children.set(id, {
          index: 'a0',
        });
      }

      this.buildTree();
      this.layout();
    });

    return id!;
  }

  addTree(parent: string | null, tree: NodeType, sibling?: string) {
    const traverse = (
      node: NodeType,
      parent: string | null,
      sibling?: string
    ) => {
      const nodeId = this.addNode(parent, 'shape', sibling, 'after', {
        text: node.text,
      });

      node.children?.forEach(child => {
        traverse(child, nodeId);
      });

      return nodeId;
    };

    return traverse(tree, parent, sibling);
  }

  removeDescendant(id: string) {
    if (!this._nodeMap.has(id)) {
      return;
    }

    const surface = this.surface;
    const removedDescendants: string[] = [];
    const remove = (element: MindmapNode) => {
      element.children?.forEach(child => {
        remove(child);
      });

      this.children.delete(element.id);
      removedDescendants.push(element.id);
    };

    surface.doc.transact(() => {
      remove(this._nodeMap.get(id)!);
      this.setChildIds(Array.from(this.children.keys()), true);
      removedDescendants.forEach(id => surface.removeElement(id));
    });
  }

  layout() {
    if (!this.tree) return;
    this.connectors = new Map();
    this.surface.doc.transact(() => {
      layout(this._tree, this);
    });
  }

  calcConnection() {
    this.connectors = new Map();
    const walk = (
      node: MindmapNode,
      layoutDir: LayoutType.LEFT | LayoutType.RIGHT,
      path: number[],
      children: MindmapNode[] = node.children
    ) => {
      children.forEach((child, idx) => {
        idx = node.children === children ? idx : node.children.indexOf(child);

        const currentPath = [...path, idx];

        this.addConnector(
          node,
          child,
          layoutDir,
          this.styleGetter.getNodeStyle(child, currentPath).connector
        );

        walk(child, layoutDir, currentPath);
      });
    };

    walk(this._tree, LayoutType.LEFT, [0], this._tree.left);
    walk(this._tree, LayoutType.RIGHT, [0], this._tree.right);
  }

  protected addConnector(
    from: MindmapNode,
    to: MindmapNode,
    layout: LayoutType,
    connectorStyle: ConnectorStyle
  ) {
    const id = `#${from.id}-${to.id}`;

    if (!this.connectors.has(id)) {
      const connector = new LocalConnectorElementModel();
      this.connectors.set(id, connector);
    }

    const connector = this.connectors.get(id)!;

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
  }

  getLayoutDir(element: string | EdgelessModel): LayoutType | null {
    if (this.layoutType !== LayoutType.BALANCE) {
      return this.layoutType;
    }

    const id = typeof element === 'string' ? element : element.id;

    if (!this._nodeMap.has(id)) {
      return null;
    }

    let node = this._nodeMap.get(id)!;
    const root = this._tree;

    while (node?.detail.parent && node.detail.parent !== root.id) {
      node = this._nodeMap.get(node.detail.parent)!;
    }

    return root.left.includes(node)
      ? LayoutType.LEFT
      : root.right.includes(node)
        ? LayoutType.RIGHT
        : this.layoutType;
  }

  private _queued = false;

  requestLayout() {
    if (!this._queued) {
      this._queued = true;

      queueMicrotask(() => {
        this.layout();
        this._queued = false;
      });
    }
  }

  applyStyle() {
    this.surface.doc.transact(() => {
      const style = this.styleGetter;
      applyNodeStyle(this._tree, style.root);

      const walk = (node: MindmapNode, path: number[]) => {
        node.children.forEach((child, idx) => {
          const currentPath = [...path, idx];
          const nodeStyle = style.getNodeStyle(child, currentPath);
          const connectorId = `#${node.id}-${child.id}`;

          applyNodeStyle(child, nodeStyle.node);

          if (this.connectors.has(connectorId)) {
            applyConnectorStyle(
              this.connectors.get(connectorId)!,
              nodeStyle.connector
            );
          }

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

    return (
      childrenTree[direction === 'next' ? idx + 1 : idx - 1]?.element ?? null
    );
  }

  getChildNodes(id: string, subtree?: 'left' | 'right') {
    const node = this._nodeMap.get(id);

    if (!node) {
      return [];
    }

    if (subtree && id === this._tree.id) {
      return this._tree[subtree].map(child => child.element);
    }

    return node.children.map(child => child.element);
  }
}

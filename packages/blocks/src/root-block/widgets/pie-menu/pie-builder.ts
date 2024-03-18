import { assertExists } from '@blocksuite/global/utils';

import {
  type IPieActionNode,
  type IPieMenuSchema,
  type IPieNode,
  type IPieSubmenuNode,
} from './base.js';
import { calcNodeAngles, calcNodeWedges, isNodeWithChildren } from './utils.js';

type PieBuilderConstructorProps = Omit<
  IPieMenuSchema,
  'root' | 'angle' | 'startAngle' | 'endAngle' | 'disabled'
> & { icon: IPieNode['icon'] };

// TODO: add types for root element (XXXXRootBlockComponent) based on scope; Need Help!
export class PieMenuBuilder {
  private _schema: IPieMenuSchema | null = null;
  private _stack: IPieNode[] = [];

  constructor(base: PieBuilderConstructorProps) {
    this._schema = {
      ...base,
      root: {
        type: 'root',
        children: [],
        label: base.label,
        icon: base.icon,
        disabled: false,
      },
    };
    this._stack.push(this._schema.root);
  }

  action(node: Omit<IPieActionNode, 'type'>) {
    const curNode = this._currentNode();
    const actionNode: IPieActionNode = { ...node, type: 'action' };

    if (isNodeWithChildren(curNode)) {
      curNode.children.push(actionNode);
    }

    return this;
  }

  beginSubmenu(node: Omit<IPieSubmenuNode, 'type' | 'children'>) {
    const curNode = this._currentNode();
    const submenuNode: IPieSubmenuNode = {
      ...node,
      type: 'submenu',
      children: [],
    };
    if (isNodeWithChildren(curNode)) {
      curNode.children.push(submenuNode);
    }

    this._stack.push(submenuNode);

    return this;
  }

  endSubmenu() {
    if (this._stack.length === 1)
      throw new Error('Cant end submenu already on the root node');
    this._stack.pop();

    return this;
  }

  reset(base: PieBuilderConstructorProps) {
    this._stack = [];
    this._schema = {
      ...base,
      root: { type: 'root', children: [], label: base.label },
    };

    this._stack.push(this._schema.root);
  }

  private _computeAngles(node: IPieNode) {
    if (
      !isNodeWithChildren(node) ||
      !node.children ||
      node.children.length === 0
    ) {
      return;
    }
    const parentAngle =
      node.angle == undefined ? undefined : (node.angle + 180) % 360;
    const angles = calcNodeAngles(node.children, parentAngle);
    const wedges = calcNodeWedges(angles, parentAngle);

    for (let i = 0; i < node.children.length; ++i) {
      const child = node.children[i];
      child.angle = angles[i];
      child.startAngle = wedges[i].start;
      child.endAngle = wedges[i].end;

      this._computeAngles(child);
    }
  }

  build() {
    const schema = this._schema;
    assertExists(schema);
    this._computeAngles(schema.root);

    this._schema = null;
    this._stack = [];
    return schema;
  }

  private _currentNode(): IPieNode {
    const node = this._stack[this._stack.length - 1];
    assertExists(node, 'No node active');
    return node;
  }
}

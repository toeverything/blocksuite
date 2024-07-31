import { assertExists } from '@blocksuite/global/utils';

import type {
  ActionFunction,
  PieColorNodeModel,
  PieCommandNodeModel,
  PieMenuContext,
  PieMenuSchema,
  PieNodeModel,
  PieSubmenuNodeModel,
} from './base.js';

import { ColorUnit } from '../../edgeless/components/panel/color-panel.js';
import { PieManager } from './pie-manager.js';
import { calcNodeAngles, calcNodeWedges, isNodeWithChildren } from './utils.js';

export interface IPieColorPickerNodeProps {
  label: string;
  active: (ctx: PieMenuContext) => string;
  onChange: PieColorNodeModel['onChange'];
  openOnHover?: PieSubmenuNodeModel['openOnHover'];
  hollow?: boolean;
  colors: { color: string }[];
}

type PieBuilderConstructorProps = Omit<
  PieMenuSchema,
  'root' | 'angle' | 'startAngle' | 'endAngle' | 'disabled'
> & { icon: PieNodeModel['icon'] };

export class PieMenuBuilder {
  private _schema: PieMenuSchema | null = null;

  private _stack: PieNodeModel[] = [];

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

  private _computeAngles(node: PieNodeModel) {
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

  private _currentNode(): PieNodeModel {
    const node = this._stack[this._stack.length - 1];
    assertExists(node, 'No node active');
    return node;
  }

  beginSubmenu(
    node: Omit<PieSubmenuNodeModel, 'type' | 'children' | 'role'>,
    action?: PieSubmenuNodeModel['action']
  ) {
    const curNode = this._currentNode();
    const submenuNode: PieSubmenuNodeModel = {
      openOnHover: true,
      ...node,
      type: 'submenu',
      role: action ? 'default' : 'command',
      action,
      children: [],
    };
    if (submenuNode.action !== undefined)
      submenuNode.timeoutOverride =
        PieManager.settings.EXPANDABLE_ACTION_NODE_TIMEOUT;

    if (isNodeWithChildren(curNode)) {
      curNode.children.push(submenuNode);
    }

    this._stack.push(submenuNode);

    return this;
  }

  build() {
    const schema = this._schema;
    assertExists(schema);
    this._computeAngles(schema.root);

    this._schema = null;
    this._stack = [];
    return schema;
  }

  colorPicker(props: IPieColorPickerNodeProps) {
    const hollow = props.hollow ?? false;

    const icon = (ctx: PieMenuContext) => {
      const color = props.active(ctx);

      return ColorUnit(color, { hollowCircle: hollow });
    };

    const colorPickerNode: PieSubmenuNodeModel = {
      type: 'submenu',
      icon,
      label: props.label,
      role: 'color-picker',
      openOnHover: props.openOnHover ?? true,
      children: props.colors.map(({ color }) => ({
        icon: () => ColorUnit(color, { hollowCircle: hollow }),
        type: 'color',
        hollowCircle: hollow,
        label: color,
        color: color,
        onChange: props.onChange,
      })),
    };

    const curNode = this._currentNode();
    if (isNodeWithChildren(curNode)) {
      curNode.children.push(colorPickerNode);
    }
  }

  command(node: Omit<PieCommandNodeModel, 'type'>) {
    const curNode = this._currentNode();
    const actionNode: PieCommandNodeModel = { ...node, type: 'command' };

    if (isNodeWithChildren(curNode)) {
      curNode.children.push(actionNode);
    }

    return this;
  }

  endSubmenu() {
    if (this._stack.length === 1)
      throw new Error('Cant end submenu already on the root node');
    this._stack.pop();

    return this;
  }

  expandableCommand(
    node: Omit<PieSubmenuNodeModel, 'type' | 'children' | 'role'> & {
      action: ActionFunction;
      submenus: (pie: PieMenuBuilder) => void;
    }
  ) {
    const { icon, label } = node;
    this.beginSubmenu({ icon, label }, node.action);
    node.submenus(this);
    this.endSubmenu();
  }

  reset(base: PieBuilderConstructorProps) {
    this._stack = [];
    this._schema = {
      ...base,
      root: { type: 'root', children: [], label: base.label },
    };

    this._stack.push(this._schema.root);
  }
}

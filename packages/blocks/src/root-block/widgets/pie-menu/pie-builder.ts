import { assertExists } from '@blocksuite/global/utils';

import type { CssVariableName } from '../../../_common/theme/css-variables.js';
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
  active: (ctx: PieMenuContext) => CssVariableName;
  colors: { color: CssVariableName }[];
  hollow?: boolean;
  label: string;
  onChange: PieColorNodeModel['onChange'];
  openOnHover?: PieSubmenuNodeModel['openOnHover'];
}

type PieBuilderConstructorProps = { icon: PieNodeModel['icon'] } & Omit<
  PieMenuSchema,
  'angle' | 'disabled' | 'endAngle' | 'root' | 'startAngle'
>;

export class PieMenuBuilder {
  private _schema: PieMenuSchema | null = null;

  private _stack: PieNodeModel[] = [];

  constructor(base: PieBuilderConstructorProps) {
    this._schema = {
      ...base,
      root: {
        children: [],
        disabled: false,
        icon: base.icon,
        label: base.label,
        type: 'root',
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
    node: Omit<PieSubmenuNodeModel, 'children' | 'role' | 'type'>,
    action?: PieSubmenuNodeModel['action']
  ) {
    const curNode = this._currentNode();
    const submenuNode: PieSubmenuNodeModel = {
      openOnHover: true,
      ...node,
      action,
      children: [],
      role: action ? 'default' : 'command',
      type: 'submenu',
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
      children: props.colors.map(({ color }) => ({
        color: color,
        hollowCircle: hollow,
        icon: () => ColorUnit(color, { hollowCircle: hollow }),
        label: color,
        onChange: props.onChange,
        type: 'color',
      })),
      icon,
      label: props.label,
      openOnHover: props.openOnHover ?? true,
      role: 'color-picker',
      type: 'submenu',
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
    node: {
      action: ActionFunction;
      submenus: (pie: PieMenuBuilder) => void;
    } & Omit<PieSubmenuNodeModel, 'children' | 'role' | 'type'>
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
      root: { children: [], label: base.label, type: 'root' },
    };

    this._stack.push(this._schema.root);
  }
}

import type { TemplateResult } from 'lit';

import type { CssVariableName } from '../../../_common/theme/css-variables.js';
import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { PieMenuId } from '../../types.js';
import type { AffinePieMenuWidget } from './index.js';
import type { PieMenu } from './menu.js';
import type { PieNode } from './node.js';

export interface IPieMenuSchema {
  id: PieMenuId;

  label: string;

  root: IPieRootNode;

  trigger: (props: {
    keyEvent: KeyboardEvent;
    rootElement: EdgelessRootBlockComponent;
  }) => boolean;
}

export type IconGetter = (ctx: PieMenuContext) => TemplateResult;
export type DisabledGetter = (ctx: PieMenuContext) => boolean;
export interface IPieBaseNode {
  type: 'root' | 'command' | 'submenu' | 'toggle' | 'color';

  label: string;

  icon?: IconGetter | TemplateResult;

  angle?: number;

  startAngle?: number;

  endAngle?: number;

  disabled?: boolean | DisabledGetter;
}

// A menu can only have one root node
export interface IPieRootNode extends IPieBaseNode {
  type: 'root';
  children: Array<IPieNonRootNode>;
}

export type PieMenuContext = {
  rootElement: EdgelessRootBlockComponent;
  menu: PieMenu;
  widgetElement: AffinePieMenuWidget;
  node: PieNode;
};
export type ActionFunction = (ctx: PieMenuContext) => void;

// Nodes which can perform a given action
export interface IPieCommandNode extends IPieBaseNode {
  type: 'command';
  action: ActionFunction;
}

// Open a submenu
export interface IPieSubmenuNode extends IPieBaseNode {
  type: 'submenu';
  role: 'default' | 'color-picker' | 'command';
  action?: ActionFunction;
  children: Array<IPieNonRootNode>;
  openOnHover?: boolean;
  timeoutOverride?: number;
}

export interface IPieColorNode extends IPieBaseNode {
  type: 'color';
  color: CssVariableName;
  hollowCircle: boolean;
  text?: string;
  onChange: (color: CssVariableName, ctx: PieMenuContext) => void;
}

export type IPieNodeWithAction =
  | IPieCommandNode
  | (IPieSubmenuNode & { role: 'command'; action: ActionFunction });

export type IPieNonRootNode = IPieCommandNode | IPieColorNode | IPieSubmenuNode;

export type IPieNode = IPieRootNode | IPieNonRootNode;

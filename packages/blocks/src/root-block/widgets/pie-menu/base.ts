import type { TemplateResult } from 'lit';

import type { EdgelessRootBlockComponent } from '../../edgeless/edgeless-root-block.js';
import type { PieMenuId } from '../../types.js';
import type { AffinePieMenuWidget } from './index.js';
import type { PieMenu } from './menu.js';
import type { PieNode } from './node.js';

export interface PieMenuSchema {
  id: PieMenuId;

  label: string;

  root: PieRootNodeModel;

  trigger: (props: {
    keyEvent: KeyboardEvent;
    rootComponent: EdgelessRootBlockComponent;
  }) => boolean;
}

export type IconGetter = (ctx: PieMenuContext) => TemplateResult;
export type DisabledGetter = (ctx: PieMenuContext) => boolean;
export interface PieBaseNodeModel {
  type: 'root' | 'command' | 'submenu' | 'toggle' | 'color';

  label: string;

  icon?: IconGetter | TemplateResult;

  angle?: number;

  startAngle?: number;

  endAngle?: number;

  disabled?: boolean | DisabledGetter;
}

// A menu can only have one root node
export interface PieRootNodeModel extends PieBaseNodeModel {
  type: 'root';
  children: Array<PieNonRootNode>;
}

export type PieMenuContext = {
  rootComponent: EdgelessRootBlockComponent;
  menu: PieMenu;
  widgetComponent: AffinePieMenuWidget;
  node: PieNode;
};
export type ActionFunction = (ctx: PieMenuContext) => void;

// Nodes which can perform a given action
export interface PieCommandNodeModel extends PieBaseNodeModel {
  type: 'command';
  action: ActionFunction;
}

// Open a submenu
export interface PieSubmenuNodeModel extends PieBaseNodeModel {
  type: 'submenu';
  role: 'default' | 'color-picker' | 'command';
  action?: ActionFunction;
  children: Array<PieNonRootNode>;
  openOnHover?: boolean;
  timeoutOverride?: number;
}

export interface PieColorNodeModel extends PieBaseNodeModel {
  type: 'color';
  color: string;
  hollowCircle: boolean;
  text?: string;
  onChange: (color: string, ctx: PieMenuContext) => void;
}

export type IPieNodeWithAction =
  | PieCommandNodeModel
  | (PieSubmenuNodeModel & { role: 'command'; action: ActionFunction });

export type PieNonRootNode =
  | PieCommandNodeModel
  | PieColorNodeModel
  | PieSubmenuNodeModel;

export type PieNodeModel = PieRootNodeModel | PieNonRootNode;

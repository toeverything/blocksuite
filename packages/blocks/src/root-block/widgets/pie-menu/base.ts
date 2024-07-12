import type { TemplateResult } from 'lit';

import type { CssVariableName } from '../../../_common/theme/css-variables.js';
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
    rootElement: EdgelessRootBlockComponent;
  }) => boolean;
}

export type IconGetter = (ctx: PieMenuContext) => TemplateResult;
export type DisabledGetter = (ctx: PieMenuContext) => boolean;
export interface PieBaseNodeModel {
  angle?: number;

  disabled?: DisabledGetter | boolean;

  endAngle?: number;

  icon?: IconGetter | TemplateResult;

  label: string;

  startAngle?: number;

  type: 'color' | 'command' | 'root' | 'submenu' | 'toggle';
}

// A menu can only have one root node
export interface PieRootNodeModel extends PieBaseNodeModel {
  children: Array<PieNonRootNode>;
  type: 'root';
}

export type PieMenuContext = {
  menu: PieMenu;
  node: PieNode;
  rootElement: EdgelessRootBlockComponent;
  widgetElement: AffinePieMenuWidget;
};
export type ActionFunction = (ctx: PieMenuContext) => void;

// Nodes which can perform a given action
export interface PieCommandNodeModel extends PieBaseNodeModel {
  action: ActionFunction;
  type: 'command';
}

// Open a submenu
export interface PieSubmenuNodeModel extends PieBaseNodeModel {
  action?: ActionFunction;
  children: Array<PieNonRootNode>;
  openOnHover?: boolean;
  role: 'color-picker' | 'command' | 'default';
  timeoutOverride?: number;
  type: 'submenu';
}

export interface PieColorNodeModel extends PieBaseNodeModel {
  color: CssVariableName;
  hollowCircle: boolean;
  onChange: (color: CssVariableName, ctx: PieMenuContext) => void;
  text?: string;
  type: 'color';
}

export type IPieNodeWithAction =
  | ({ action: ActionFunction; role: 'command' } & PieSubmenuNodeModel)
  | PieCommandNodeModel;

export type PieNonRootNode =
  | PieColorNodeModel
  | PieCommandNodeModel
  | PieSubmenuNodeModel;

export type PieNodeModel = PieNonRootNode | PieRootNodeModel;

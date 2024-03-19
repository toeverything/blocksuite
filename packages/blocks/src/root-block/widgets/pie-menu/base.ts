import type { TemplateResult } from 'lit';

import type { PieMenuId, RootBlockComponent } from '../../types.js';
import type { AffinePieMenuWidget } from './index.js';
import type { PieMenu } from './menu.js';
import type { PieNode } from './node.js';

export interface IPieMenuSchema {
  id: PieMenuId;

  label: string;

  root: IPieRootNode;

  scope: { page?: boolean; edgeless?: boolean };

  trigger: (props: {
    keyEvent: KeyboardEvent;
    rootElement: RootBlockComponent;
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
  rootElement: RootBlockComponent;
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

// Allows to toggle functionality by mouse enter or click but does not close the menu
export interface IPieToggleNode extends IPieBaseNode {
  type: 'toggle';
  action: ActionFunction;
  // TODO add array of actions which which can be toggled with wheel or arrow
}

export type IPieNodeWithAction = IPieCommandNode | IPieToggleNode;

export type IPieNonRootNode =
  | IPieCommandNode
  | IPieColorNode
  | IPieSubmenuNode
  | IPieToggleNode;

export type IPieNode = IPieRootNode | IPieNonRootNode;

// ----------------------------------------------------------
// TODO: DEV
// Open a submenu
export interface IPieSubmenuNode extends IPieBaseNode {
  type: 'submenu';
  children: Array<IPieNonRootNode>;
}

// For a color picker sub menu
export interface IPieColorNode extends IPieBaseNode {
  type: 'color';
  onColorChange: (color: string) => void;
}

import type { TemplateResult } from 'lit';

import type { PieMenuId, RootBlockComponent } from '../../types.js';
import type { AffinePieMenuWidget } from './index.js';
import type { PieMenu } from './menu.js';
import type { PieNode } from './node.js';

export interface IPieMenuSchema {
  id: PieMenuId;

  /**
   *  Label Describing your menu
   */
  label: string;

  /**
   * The root node.
   */
  root: IPieRootNode;

  /**
   * Whether to render the menu in page, edgeless or both
   */
  scope: { page?: boolean; edgeless?: boolean };

  /**
   * Tests the key to open the menu
   */
  trigger: (props: {
    keyEvent: KeyboardEvent;
    rootElement: RootBlockComponent;
  }) => boolean;
}

export type IconGetter = (ctx: PieMenuContext) => TemplateResult;
export type DisabledGetter = (ctx: PieMenuContext) => boolean;
export interface IPieBaseNode {
  type: 'root' | 'action' | 'submenu';

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
export interface IPieActionNode extends IPieBaseNode {
  type: 'action';
  action: ActionFunction;
}

// Open a submenu
export interface IPieSubmenuNode extends IPieBaseNode {
  type: 'submenu';
  children: Array<IPieNonRootNode>;
}

// TODO: a color menu node

export type IPieNonRootNode = IPieActionNode | IPieSubmenuNode;

export type IPieNode = IPieRootNode | IPieNonRootNode;

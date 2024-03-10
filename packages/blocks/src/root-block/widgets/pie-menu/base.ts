import type { TemplateResult } from 'lit';

import type { RootBlockComponent } from '../../types.js';

export interface IPieMenuSchema {
  id: string; // TODO use typed (eg: PieMenuId = typeof MenuName...)

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

export interface IPieBaseNode {
  type: 'root' | 'action' | 'submenu';

  label: string;

  icon?: TemplateResult;

  angle?: number;

  startAngle?: number;

  endAngle?: number;
}

// A menu can only have one root node
export interface IPieRootNode extends IPieBaseNode {
  type: 'root';
  children: Array<IPieNonRootNode>;
}

// Nodes which can perform a given action
export interface IPieActionNode extends IPieBaseNode {
  type: 'action';
  action: () => void;
}

// Open a submenu
export interface IPieSubmenuNode extends IPieBaseNode {
  type: 'submenu';
  children: Array<IPieNonRootNode>;
}

export type IPieNonRootNode = IPieActionNode | IPieSubmenuNode;

export type IPieNode = IPieRootNode | IPieNonRootNode;

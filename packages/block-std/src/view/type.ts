import type { BlockSuiteViewSpec } from './view-store.js';

export type NodeView<T = unknown> = {
  id: string;
  path: string[];
  view: T;
  type: BlockSuite.ViewType;
};
export type NodeViewTree<T> = NodeView<T> & {
  children: NodeViewTree<T>[];
};

export type SpecToNodeView<T> = T extends BlockSuiteViewSpec<infer U>
  ? U
  : unknown;

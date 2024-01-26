import type { Workspace } from '../workspace.js';
import type { WorkspaceOptions } from '../workspace.js';

type WorkspaceConstructor<Keys extends string> = {
  new (storeOptions: WorkspaceOptions): Omit<Workspace, Keys>;
};

export type AddOn<Keys extends string> = (
  originalClass: WorkspaceConstructor<Keys>
) => { new (storeOptions: WorkspaceOptions): unknown };

export type AddOnReturn<Keys extends string> = (
  originalClass: WorkspaceConstructor<Keys>
) => typeof Workspace;

export function addOnFactory<Keys extends string>(fn: AddOn<Keys>) {
  return fn as AddOnReturn<Keys>;
}

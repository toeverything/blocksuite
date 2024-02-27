import { type Workspace } from '@blocksuite/store';

export interface InitFn {
  (workspace: Workspace, docId: string): Promise<void> | void;
  id: string;
  displayName: string;
  description: string;
}

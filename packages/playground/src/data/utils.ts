import { type Workspace } from '@blocksuite/store';

export interface InitFn {
  (workspace: Workspace, pageId: string): void;
  id: string;
  displayName: string;
  description: string;
}

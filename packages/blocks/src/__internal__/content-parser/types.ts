import type { BaseBlockModel } from '@blocksuite/store';

export interface SelectedBlock {
  model: BaseBlockModel;
  startPos?: number;
  endPos?: number;
  children: SelectedBlock[];
}

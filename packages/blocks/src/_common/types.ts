import type {
  ConnectorElementModel,
  GroupElementModel,
} from '@blocksuite/affine-model';
import type { Slot } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';

import type { BrushElementModel } from '../surface-block/index.js';
import type { RefNodeSlots } from './inline/presets/nodes/reference-node/reference-node.js';

/** Common context interface definition for block models. */

export type CommonSlots = RefNodeSlots;

export type DocMode = 'page' | 'edgeless';

type EditorSlots = {
  editorModeSwitched: Slot<DocMode>;
  docUpdated: Slot<{ newDocId: string }>;
};

export type AbstractEditor = {
  doc: Doc;
  mode: DocMode;
  readonly slots: CommonSlots & EditorSlots;
} & HTMLElement;

export type Connectable = Exclude<
  BlockSuite.EdgelessModel,
  ConnectorElementModel | BrushElementModel | GroupElementModel
>;

export type { EmbedCardStyle } from '@blocksuite/affine-model';
export * from '@blocksuite/affine-shared/types';

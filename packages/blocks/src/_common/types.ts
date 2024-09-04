import type { BrushElementModel } from '@blocksuite/affine-block-surface';
import type { RefNodeSlots } from '@blocksuite/affine-components/rich-text';
import type {
  ConnectorElementModel,
  DocMode,
  GroupElementModel,
} from '@blocksuite/affine-model';
import type { Slot } from '@blocksuite/global/utils';
import type { Doc } from '@blocksuite/store';

/** Common context interface definition for block models. */

// TODO: remove
export type CommonSlots = RefNodeSlots;

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
